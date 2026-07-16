import { CommerceError } from "../errors";
import type { PaymentProvider } from "./types";

const providers = new Map<string, PaymentProvider>();

export function registerPaymentProvider(provider: PaymentProvider) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(provider.id)) {
    throw new Error("Payment provider IDs must be lowercase slugs.");
  }
  if (providers.has(provider.id)) throw new Error(`Payment provider ${provider.id} is already registered.`);
  providers.set(provider.id, provider);
}

export function getPaymentProvider(id: string) {
  const provider = providers.get(id);
  if (!provider) {
    throw new CommerceError("PAYMENT_PROVIDER_UNAVAILABLE", "The selected payment provider is not available.", 503);
  }
  return provider;
}

export function listPaymentProviders() {
  return [...providers.values()].map(({ id, label }) => ({ id, label }));
}
