"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";

import type { ShopProduct } from "@/types/shop";

const cartStorageKey = "arteffect-cart-id";
const presentationStorageKey = "arteffect-cart-presentation";

export type CartItem = {
  id: string;
  productId: number | string;
  variantId: string;
  image: string;
  imageAlt: string;
  name: string;
  price: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  currency?: string;
};

export type CartAddItem = Pick<
  CartItem,
  "id" | "productId" | "variantId" | "image" | "imageAlt" | "name" | "price"
>;

export type ShippingQuote = {
  id: number | string;
  code: string;
  name: string;
  description: string;
  amount: number;
  minimumDeliveryDays: number;
  maximumDeliveryDays: number;
};

type ServerCartItem = {
  id?: string;
  product: number | string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
};

export type CommerceCart = {
  id: number | string;
  status: string;
  items: ServerCartItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  couponCode?: string | null;
  shippingEstimate?: {
    country?: string;
    postalCode?: string;
    methodCode?: string;
    methodName?: string;
    minimumDeliveryDays?: number;
    maximumDeliveryDays?: number;
  } | null;
};

export type CheckoutResult = {
  order: {
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
  };
  cart?: CommerceCart;
  paymentProviders: unknown[];
  requiresPayment: boolean;
  reservationExpiresAt: string;
};

export type CheckoutInput = {
  email: string;
  shippingMethodCode: string;
  shippingAddress: {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone: string;
  };
};

type Presentation = Pick<CartItem, "image" | "imageAlt">;

type CartContextValue = {
  addItem: (item: CartAddItem) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  cart: CommerceCart | null;
  checkout: (input: CheckoutInput) => Promise<CheckoutResult>;
  clearCart: () => Promise<void>;
  clearError: () => void;
  drawerOpen: boolean;
  error: string;
  estimateShipping: (country: string, postalCode?: string, methodCode?: string) => Promise<ShippingQuote[]>;
  isLoading: boolean;
  isMutating: boolean;
  itemCount: number;
  items: CartItem[];
  quotes: ShippingQuote[];
  removeCoupon: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  setDrawerOpen: (open: boolean) => void;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  upsells: ShopProduct[];
};

type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CommerceCart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [upsells, setUpsells] = useState<ShopProduct[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState("");
  const cartRef = useRef<CommerceCart | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  const presentationRef = useRef<Record<string, Presentation>>({});
  const createPromiseRef = useRef<Promise<CommerceCart> | null>(null);
  const mutationChainRef = useRef<Promise<unknown>>(Promise.resolve());

  const commitCart = useCallback((next: CommerceCart) => {
    cartRef.current = next;
    setCart(next);
    const mapped = mapCartItems(next.items, presentationRef.current);
    itemsRef.current = mapped;
    setItems(mapped);
    setQuotes([]);
    if (!mapped.length) setUpsells([]);
    try {
      if (next.status === "active") window.localStorage.setItem(cartStorageKey, String(next.id));
    } catch {
      // The HttpOnly cart cookie still protects the active server cart.
    }
  }, []);

  useEffect(() => {
    let active = true;
    let storedCartId: string | null = null;
    try {
      presentationRef.current = readPresentation();
      storedCartId = window.localStorage.getItem(cartStorageKey);
    } catch {
      storedCartId = null;
    }

    if (!storedCartId) {
      queueMicrotask(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }

    commerceRequest<CommerceCart>(`/api/cart/${encodeURIComponent(storedCartId)}`)
      .then((restored) => {
        if (!active) return;
        if (restored.status === "active") commitCart(restored);
        else clearStoredCart();
      })
      .catch(() => {
        if (active) clearStoredCart();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [commitCart]);

  const enqueue = useCallback(<T,>(operation: () => Promise<T>) => {
    const result = mutationChainRef.current.then(operation, operation);
    mutationChainRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, []);

  const runMutation = useCallback(async <T,>(operation: () => Promise<T>) => {
    setPendingCount((count) => count + 1);
    setError("");
    try {
      return await operation();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The cart could not be updated.";
      setError(message);
      throw reason;
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const ensureCart = useCallback(async () => {
    if (cartRef.current?.status === "active") return cartRef.current;
    if (createPromiseRef.current) return createPromiseRef.current;

    createPromiseRef.current = commerceRequest<CommerceCart>("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }).then((created) => {
      commitCart(created);
      return created;
    }).finally(() => {
      createPromiseRef.current = null;
    });
    return createPromiseRef.current;
  }, [commitCart]);

  const addItem = useCallback((item: CartAddItem) => {
    setDrawerOpen(true);
    rememberPresentation(item.variantId, item, presentationRef);

    return enqueue(() => runMutation(async () => {
      const snapshot = itemsRef.current;
      setItems((current) => {
        const existing = current.find((entry) => entry.id === item.id);
        if (!existing) return [...current, { ...item, quantity: 1 }];
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      });
      try {
        const activeCart = await ensureCart();
        const updated = await commerceRequest<CommerceCart>(
          `/api/cart/${encodeURIComponent(String(activeCart.id))}/items`,
          jsonRequest("POST", { productId: item.productId, variantId: item.variantId, quantity: 1 })
        );
        commitCart(updated);
      } catch (reason) {
        itemsRef.current = snapshot;
        setItems(snapshot);
        throw reason;
      }
    })).catch(() => undefined);
  }, [commitCart, enqueue, ensureCart, runMutation]);

  const removeItem = useCallback((id: string) => enqueue(() => runMutation(async () => {
    const activeCart = cartRef.current;
    if (!activeCart) return;
    const snapshot = itemsRef.current;
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      const updated = await commerceRequest<CommerceCart>(
        `/api/cart/${encodeURIComponent(String(activeCart.id))}/items/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      commitCart(updated);
    } catch (reason) {
      itemsRef.current = snapshot;
      setItems(snapshot);
      throw reason;
    }
  })), [commitCart, enqueue, runMutation]);

  const updateQuantity = useCallback((id: string, quantity: number) => enqueue(() => runMutation(async () => {
    const activeCart = cartRef.current;
    if (!activeCart) return;
    const snapshot = itemsRef.current;
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
    try {
      const path = `/api/cart/${encodeURIComponent(String(activeCart.id))}/items/${encodeURIComponent(id)}`;
      const updated = await commerceRequest<CommerceCart>(
        path,
        quantity < 1 ? { method: "DELETE" } : jsonRequest("PATCH", { quantity })
      );
      commitCart(updated);
    } catch (reason) {
      itemsRef.current = snapshot;
      setItems(snapshot);
      throw reason;
    }
  })), [commitCart, enqueue, runMutation]);

  const clearCart = useCallback(() => enqueue(() => runMutation(async () => {
    const activeCart = cartRef.current;
    if (!activeCart) return;
    let latest = activeCart;
    for (const line of activeCart.items) {
      if (!line.id) continue;
      latest = await commerceRequest<CommerceCart>(
        `/api/cart/${encodeURIComponent(String(activeCart.id))}/items/${encodeURIComponent(line.id)}`,
        { method: "DELETE" }
      );
    }
    commitCart(latest);
  })), [commitCart, enqueue, runMutation]);

  const applyCoupon = useCallback((code: string) => enqueue(() => runMutation(async () => {
    const activeCart = await ensureCart();
    const updated = await commerceRequest<CommerceCart>(
      `/api/cart/${encodeURIComponent(String(activeCart.id))}/coupon`,
      jsonRequest("POST", { code })
    );
    commitCart(updated);
  })), [commitCart, enqueue, ensureCart, runMutation]);

  const removeCoupon = useCallback(() => enqueue(() => runMutation(async () => {
    const activeCart = cartRef.current;
    if (!activeCart) return;
    const updated = await commerceRequest<CommerceCart>(
      `/api/cart/${encodeURIComponent(String(activeCart.id))}/coupon`,
      { method: "DELETE" }
    );
    commitCart(updated);
  })), [commitCart, enqueue, runMutation]);

  const estimateShipping = useCallback((country: string, postalCode?: string, methodCode?: string) =>
    enqueue(() => runMutation(async () => {
      const activeCart = await ensureCart();
      const result = await commerceRequest<{ cart: CommerceCart; quotes: ShippingQuote[] }>(
        `/api/cart/${encodeURIComponent(String(activeCart.id))}/shipping-estimate`,
        jsonRequest("POST", { country, postalCode, methodCode })
      );
      commitCart(result.cart);
      setQuotes(result.quotes);
      return result.quotes;
    })), [commitCart, enqueue, ensureCart, runMutation]);

  const checkout = useCallback((input: CheckoutInput) => enqueue(() => runMutation(async () => {
    const activeCart = await ensureCart();
    const result = await commerceRequest<CheckoutResult>(
      "/api/checkout",
      jsonRequest("POST", { ...input, cartId: activeCart.id })
    );
    if (result.cart) commitCart(result.cart);
    clearStoredCart();
    return result;
  })), [commitCart, enqueue, ensureCart, runMutation]);

  const itemSignature = cart?.items.map((item) => `${item.product}:${item.variantId}:${item.quantity}`).join("|") ?? "";
  useEffect(() => {
    if (!cart?.id || !itemSignature) {
      return;
    }
    let active = true;
    commerceRequest<ShopProduct[]>(`/api/cart/${encodeURIComponent(String(cart.id))}/upsells`)
      .then((products) => { if (active) setUpsells(products); })
      .catch(() => { if (active) setUpsells([]); });
    return () => { active = false; };
  }, [cart?.id, itemSignature]);

  const value = useMemo<CartContextValue>(() => ({
    addItem,
    applyCoupon,
    cart,
    checkout,
    clearCart,
    clearError: () => setError(""),
    drawerOpen,
    error,
    estimateShipping,
    isLoading,
    isMutating: pendingCount > 0,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
    quotes,
    removeCoupon,
    removeItem,
    setDrawerOpen,
    updateQuantity,
    upsells
  }), [
    addItem,
    applyCoupon,
    cart,
    checkout,
    clearCart,
    drawerOpen,
    error,
    estimateShipping,
    isLoading,
    items,
    pendingCount,
    quotes,
    removeCoupon,
    removeItem,
    updateQuantity,
    upsells
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

async function commerceRequest<T>(input: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...init?.headers }
    });
  } catch {
    throw new Error("The commerce service is unreachable. Please try again.");
  }
  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>;
  if (!response.ok || body.data === undefined) {
    throw new Error(body.error?.message || "The commerce operation could not be completed.");
  }
  return body.data;
}

function jsonRequest(method: "PATCH" | "POST", body: Record<string, unknown>): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function mapCartItems(items: ServerCartItem[], presentation: Record<string, Presentation>): CartItem[] {
  return items.map((item) => {
    const display = presentation[item.variantId];
    return {
      id: item.id ?? `${item.product}:${item.variantId}`,
      productId: item.product,
      variantId: item.variantId,
      image: display?.image ?? "",
      imageAlt: display?.imageAlt ?? item.productName,
      name: `${item.productName} — ${item.variantName}`,
      price: formatMinorMoney(item.unitPrice, item.currency),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      currency: item.currency
    };
  });
}

function formatMinorMoney(value: number, currency: string) {
  const exponent = currency === "LBP" ? 0 : 2;
  return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(value / (10 ** exponent));
}

function rememberPresentation(
  variantId: string,
  item: Presentation,
  ref: { current: Record<string, Presentation> }
) {
  ref.current = { ...ref.current, [variantId]: { image: item.image, imageAlt: item.imageAlt } };
  try {
    window.localStorage.setItem(presentationStorageKey, JSON.stringify(ref.current));
  } catch {
    // Product presentation remains available for the current visit.
  }
}

function readPresentation(): Record<string, Presentation> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(presentationStorageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).flatMap(([key, value]) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      return typeof item.image === "string" && typeof item.imageAlt === "string"
        ? [[key, { image: item.image, imageAlt: item.imageAlt }]]
        : [];
    }));
  } catch {
    return {};
  }
}

function clearStoredCart() {
  try {
    window.localStorage.removeItem(cartStorageKey);
  } catch {
    // Nothing else is needed when storage is unavailable.
  }
}
