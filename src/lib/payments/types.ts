export interface InitCheckoutInput {
  reference: string;
  email: string;
  amountCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
  callbackUrl: string;
}

export interface InitCheckoutResult {
  provider: string;
  authorizationUrl: string;
  providerRef: string;
}

export interface VerifyResult {
  status: "SUCCESS" | "FAILED" | "PENDING" | "ABANDONED";
  amountCents: number;
  currency: string;
  providerRef: string;
  paidAt?: Date;
  raw: unknown;
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  reference?: string;
  raw: unknown;
}

export interface PaymentProvider {
  name: string;
  initCheckout(input: InitCheckoutInput): Promise<InitCheckoutResult>;
  verify(reference: string): Promise<VerifyResult>;
  /** Validate the signature and parse the payload. Throws on invalid signature. */
  parseWebhook(rawBody: string, signature: string | null): WebhookEvent;
}
