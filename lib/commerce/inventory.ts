import type { Payload } from "payload";

import { CommerceError } from "./errors";
import { asCommerceRecords, numericRelationshipID, type CartLine, type CommerceRecord } from "./types";

type QueryResult<Row> = { rowCount: number | null; rows: Row[] };
type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
  release(): void;
};

export type InventoryReservation = {
  productID: number;
  variantID: string;
  sku: string;
  quantity: number;
  inventoryAfter: number;
  reservedAfter: number;
};

export async function reserveInventory(payload: Payload, lines: CartLine[]) {
  const client = await payload.db.pool.connect() as DatabaseClient;
  const reservations: InventoryReservation[] = [];
  try {
    await client.query("BEGIN");
    for (const line of lines) {
      const productID = numericRelationshipID(line.product);
      if (productID === undefined) throw new CommerceError("INVALID_CART_ITEM", "A cart item has no product reference.", 409);
      const result = await client.query<{ inventory: number; reserved: number; sku: string }>(
        `UPDATE products_variants
           SET reserved = reserved + $1
         WHERE id = $2
           AND _parent_id = $3
           AND is_available = true
           AND inventory - reserved >= $1
         RETURNING inventory, reserved, sku`,
        [line.quantity, line.variantId, productID]
      );
      if (result.rowCount !== 1) {
        throw new CommerceError("INSUFFICIENT_INVENTORY", `${line.productName} — ${line.variantName} is no longer available in that quantity.`, 409);
      }
      reservations.push({
        productID,
        variantID: line.variantId,
        sku: result.rows[0].sku,
        quantity: line.quantity,
        inventoryAfter: Number(result.rows[0].inventory),
        reservedAfter: Number(result.rows[0].reserved)
      });
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  await refreshInventoryRollups(payload, reservations.map((reservation) => reservation.productID));
  return reservations;
}

export async function releaseInventory(payload: Payload, reservations: InventoryReservation[]) {
  if (!reservations.length) return reservations;
  const client = await payload.db.pool.connect() as DatabaseClient;
  try {
    await client.query("BEGIN");
    for (const reservation of reservations) {
      const result = await client.query<{ inventory: number; reserved: number }>(
        `UPDATE products_variants
           SET reserved = GREATEST(0, reserved - $1)
         WHERE id = $2 AND _parent_id = $3
         RETURNING inventory, reserved`,
        [reservation.quantity, reservation.variantID, reservation.productID]
      );
      if (result.rowCount === 1) {
        reservation.inventoryAfter = Number(result.rows[0].inventory);
        reservation.reservedAfter = Number(result.rows[0].reserved);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  await refreshInventoryRollups(payload, reservations.map((reservation) => reservation.productID));
  return reservations;
}

export async function releaseOrderInventory(
  payload: Payload,
  order: CommerceRecord,
  finalStatus: "cancelled" | "expired"
) {
  const reservations = reservationsFromOrder(order);
  if (!reservations.length) return [];
  const client = await payload.db.pool.connect() as DatabaseClient;
  try {
    await client.query("BEGIN");
    const claimQuery = finalStatus === "cancelled"
      ? `UPDATE orders SET inventory_status = 'released', status = 'cancelled', cancelled_at = now(), updated_at = now()
           WHERE id = $1 AND inventory_status = 'reserved' AND payment_status <> 'paid'
           RETURNING id`
      : `UPDATE orders SET inventory_status = 'released', status = 'expired', updated_at = now()
           WHERE id = $1 AND inventory_status = 'reserved' AND payment_status <> 'paid'
           RETURNING id`;
    const claim = await client.query(claimQuery, [order.id]);
    if (claim.rowCount !== 1) {
      await client.query("ROLLBACK");
      return [];
    }

    for (const reservation of reservations) {
      const result = await client.query<{ inventory: number; reserved: number }>(
        `UPDATE products_variants
            SET reserved = reserved - $1
          WHERE id = $2 AND _parent_id = $3 AND reserved >= $1
          RETURNING inventory, reserved`,
        [reservation.quantity, reservation.variantID, reservation.productID]
      );
      if (result.rowCount !== 1) {
        throw new CommerceError("INVENTORY_RELEASE_FAILED", "Reserved inventory could not be released.", 409);
      }
      reservation.inventoryAfter = Number(result.rows[0].inventory);
      reservation.reservedAfter = Number(result.rows[0].reserved);
      await client.query(
        `INSERT INTO inventory_movements
          (product_id, variant_id, sku, cart_id, order_id, movement_type, quantity,
           inventory_after, reserved_after, idempotency_key, updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, 'release', $6, $7, $8, $9, now(), now())
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          reservation.productID,
          reservation.variantID,
          reservation.sku,
          numericRelationshipID(order.cart),
          order.id,
          reservation.quantity,
          reservation.inventoryAfter,
          reservation.reservedAfter,
          `${String(order.orderNumber)}:release:${reservation.variantID}`
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  await refreshInventoryRollups(payload, reservations.map((reservation) => reservation.productID));
  return reservations;
}

export async function expireStaleOrders(payload: Payload) {
  const result = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
    where: {
      and: [
        { inventoryStatus: { equals: "reserved" } },
        { paymentStatus: { not_equals: "paid" } },
        { reservationExpiresAt: { less_than_equal: new Date().toISOString() } }
      ]
    }
  });
  for (const order of asCommerceRecords(result.docs)) {
    await releaseOrderInventory(payload, order, "expired");
  }
}

export async function commitInventory(payload: Payload, reservations: InventoryReservation[]) {
  if (!reservations.length) return;
  const client = await payload.db.pool.connect() as DatabaseClient;
  try {
    await client.query("BEGIN");
    for (const reservation of reservations) {
      const result = await client.query(
        `UPDATE products_variants
           SET inventory = inventory - $1,
               reserved = reserved - $1
         WHERE id = $2
           AND _parent_id = $3
           AND inventory >= $1
           AND reserved >= $1`,
        [reservation.quantity, reservation.variantID, reservation.productID]
      );
      if (result.rowCount !== 1) throw new CommerceError("INVENTORY_COMMIT_FAILED", "Reserved inventory could not be committed.", 409);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  await refreshInventoryRollups(payload, reservations.map((reservation) => reservation.productID));
}

export async function recordInventoryMovements(
  payload: Payload,
  reservations: InventoryReservation[],
  data: {
    cartID: number;
    orderID: number;
    orderNumber: string;
    movementType: "reserve" | "release" | "sale";
  }
) {
  await Promise.all(reservations.map((reservation) => payload.create({
    collection: "inventory-movements",
    depth: 0,
    overrideAccess: true,
    data: {
      product: reservation.productID,
      variantId: reservation.variantID,
      sku: reservation.sku,
      cart: data.cartID,
      order: data.orderID,
      movementType: data.movementType,
      quantity: data.movementType === "release" ? reservation.quantity : -reservation.quantity,
      inventoryAfter: reservation.inventoryAfter,
      reservedAfter: reservation.reservedAfter,
      idempotencyKey: `${data.orderNumber}:${data.movementType}:${reservation.variantID}`
    }
  })));
}

export function reservationsFromOrder(order: CommerceRecord): InventoryReservation[] {
  if (!Array.isArray(order.items)) return [];
  return order.items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const line = item as CartLine;
    const productID = numericRelationshipID(line.product);
    if (productID === undefined) return [];
    return [{
      productID,
      variantID: line.variantId,
      sku: line.sku,
      quantity: Number(line.quantity),
      inventoryAfter: 0,
      reservedAfter: Number(line.quantity)
    }];
  });
}

async function refreshInventoryRollups(payload: Payload, productIDs: number[]) {
  const unique = [...new Set(productIDs)];
  if (!unique.length) return;
  await payload.db.pool.query(
    `UPDATE products AS product
        SET total_inventory = rollup.sellable_inventory,
            availability = CASE
              WHEN rollup.sellable_inventory <= 0 THEN 'out-of-stock'::enum_products_availability
              WHEN rollup.has_healthy_stock THEN 'in-stock'::enum_products_availability
              ELSE 'low-stock'::enum_products_availability
            END,
            updated_at = now()
       FROM (
         SELECT _parent_id AS product_id,
                SUM(CASE WHEN is_available THEN GREATEST(inventory - reserved, 0) ELSE 0 END) AS sellable_inventory,
                BOOL_OR(is_available AND GREATEST(inventory - reserved, 0) > COALESCE(low_stock_threshold, 0)) AS has_healthy_stock
           FROM products_variants
          WHERE _parent_id = ANY($1)
          GROUP BY _parent_id
       ) AS rollup
      WHERE product.id = rollup.product_id`,
    [unique]
  );
}
