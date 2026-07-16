import type { Address, CartLine } from "../types";
import type { CommerceCurrency } from "../money";

export type PaymentRequest = {
  amount: number;
  currency: CommerceCurrency;
  customerEmail: string;
  idempotencyKey: string;
  orderID: number | string;
  orderNumber: string;
  returnURL: string;
  shippingAddress: Address;
  items: CartLine[];
};

export type PaymentSession = {
  externalID: string;
  redirectURL?: string;
  clientToken?: string;
  expiresAt?: string;
};

export interface PaymentProvider {
  readonly id: string;
  readonly label: string;
  createSession(request: PaymentRequest): Promise<PaymentSession>;
  capture(externalID: string, amount?: number): Promise<void>;
  refund(externalID: string, amount?: number): Promise<{ externalID: string }>;
  verifyWebhook(request: Request): Promise<{ eventID: string; externalID: string; status: string }>;
}
