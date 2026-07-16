import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { CommerceError } from "@/lib/commerce/errors";
import { publicOrder } from "@/lib/commerce/orders";
import { checkoutAddress } from "@/lib/commerce/validation";

type CmsRecord = Record<string, unknown>;

type AccountPayload = {
  auth: (args: { headers: Headers }) => Promise<{ user?: CmsRecord | null }>;
  find: (args: {
    collection: "orders";
    depth?: number;
    limit?: number;
    page?: number;
    sort?: string;
    where: CmsRecord;
    overrideAccess?: boolean;
  }) => Promise<{ docs: CmsRecord[]; hasNextPage?: boolean; hasPrevPage?: boolean; limit?: number; page?: number; totalDocs?: number; totalPages?: number }>;
  findByID: (args: { collection: "users"; depth?: number; id: number | string; overrideAccess?: boolean }) => Promise<CmsRecord>;
  update: (args: { collection: "users"; data: CmsRecord; depth?: number; id: number | string; overrideAccess?: boolean }) => Promise<CmsRecord>;
};

export async function getAccount(headers: Headers) {
  const { payload, user } = await authenticatedAccount(headers);
  const account = await payload.findByID({ collection: "users", depth: 0, id: user.id, overrideAccess: true });
  return publicAccount(account);
}

export async function updateAccount(headers: Headers, input: Record<string, unknown>) {
  const { payload, user } = await authenticatedAccount(headers);
  const data: CmsRecord = {};

  if ("name" in input) {
    if (input.name !== null && typeof input.name !== "string") throw new CommerceError("INVALID_ACCOUNT", "name must be text.");
    const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
    if (name.length > 120 || /[\u0000-\u001F\u007F]/.test(name)) throw new CommerceError("INVALID_ACCOUNT", "name is invalid.");
    data.name = name || null;
  }
  if ("addresses" in input) data.addresses = savedAddresses(input.addresses);
  if (!Object.keys(data).length) throw new CommerceError("INVALID_ACCOUNT", "Provide name or addresses to update.");

  const account = await payload.update({ collection: "users", data, depth: 0, id: user.id, overrideAccess: true });
  return publicAccount(account);
}

export async function getAccountOrders(headers: Headers, input: { limit?: number; page?: number }) {
  const { payload, user } = await authenticatedAccount(headers);
  const page = validPagination(input.page, 1, 10_000, "page");
  const limit = validPagination(input.limit, 10, 50, "limit");
  const result = await payload.find({
    collection: "orders",
    depth: 1,
    limit,
    page,
    sort: "-createdAt",
    overrideAccess: true,
    where: { customer: { equals: user.id } }
  });
  return {
    docs: result.docs.map((order) => publicOrder(order as CmsRecord & { id: number | string })),
    hasNextPage: Boolean(result.hasNextPage),
    hasPrevPage: Boolean(result.hasPrevPage),
    limit: result.limit ?? limit,
    page: result.page ?? page,
    totalDocs: result.totalDocs ?? result.docs.length,
    totalPages: result.totalPages ?? 1
  };
}

async function authenticatedAccount(headers: Headers) {
  if (!hasPayloadDatabase()) throw new CommerceError("ACCOUNT_UNAVAILABLE", "Accounts require the configured database.", 503);
  const payload = (await getPayloadClient()) as unknown as AccountPayload;
  const { user } = await payload.auth({ headers }).catch(() => ({ user: null }));
  if (!user || (typeof user.id !== "number" && typeof user.id !== "string")) {
    throw new CommerceError("AUTHENTICATION_REQUIRED", "Sign in to access your account.", 401);
  }
  return { payload, user: { ...user, id: user.id } as CmsRecord & { id: number | string } };
}

function savedAddresses(value: unknown) {
  if (!Array.isArray(value) || value.length > 10) throw new CommerceError("INVALID_ADDRESS", "addresses must contain at most 10 entries.");
  const addresses = value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new CommerceError("INVALID_ADDRESS", `addresses[${index}] is invalid.`);
    const input = entry as CmsRecord;
    if (typeof input.label !== "string" || !input.label.trim() || input.label.trim().length > 40) {
      throw new CommerceError("INVALID_ADDRESS", `addresses[${index}].label is invalid.`);
    }
    const address = checkoutAddress(input, `addresses[${index}]`);
    const id = typeof input.id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(input.id) ? input.id : undefined;
    return { ...address, ...(id ? { id } : {}), isDefault: input.isDefault === true, label: input.label.trim() };
  });
  if (addresses.filter(({ isDefault }) => isDefault).length > 1) {
    throw new CommerceError("INVALID_ADDRESS", "Only one saved address can be the default.");
  }
  return addresses;
}

function publicAccount(account: CmsRecord) {
  const wishlist = Array.isArray(account.wishlist) ? account.wishlist : [];
  const addresses = Array.isArray(account.addresses) ? account.addresses : [];
  return {
    addresses,
    createdAt: account.createdAt,
    email: account.email,
    id: account.id,
    name: account.name ?? null,
    updatedAt: account.updatedAt,
    wishlistCount: wishlist.length
  };
}

function validPagination(value: unknown, fallback: number, maximum: number, name: string) {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new CommerceError("INVALID_PAGINATION", `${name} is invalid.`);
  }
  return Number(value);
}
