import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

const BASE = "https://api.paystack.co";

/** Whether Paystack API-driven payouts are configured on this deployment. */
export function transfersEnabled() {
  return Boolean(env.PAYSTACK_SECRET_KEY);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY) throw new ApiError(500, "NOT_CONFIGURED", "Paystack is not configured.");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || json.status === false) {
    throw new ApiError(502, "PAYSTACK_ERROR", json.message || "Paystack request failed.");
  }
  return json.data as T;
}

export type Bank = { name: string; code: string; slug: string };

export async function listBanks(currency = "NGN"): Promise<Bank[]> {
  const data = await api<Bank[]>(`/bank?currency=${currency}&perPage=200`);
  return data.map((b) => ({ name: b.name, code: b.code, slug: b.slug }));
}

/** Confirm an account number resolves at a bank. Returns the resolved name. */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<string> {
  const data = await api<{ account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  return data.account_name;
}

/** Create (or reuse) a Paystack transfer recipient for an instructor. */
export async function createRecipient(input: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}): Promise<string> {
  const data = await api<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: input.currency ?? "NGN",
    }),
  });
  return data.recipient_code;
}

export type TransferResult = {
  status: "success" | "pending" | "otp" | "failed" | string;
  transfer_code: string;
  reference: string;
};

export async function initiateTransfer(input: {
  amountCents: number;
  recipientCode: string;
  reason: string;
  reference: string;
}): Promise<TransferResult> {
  return api<TransferResult>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: input.amountCents,
      recipient: input.recipientCode,
      reason: input.reason,
      reference: input.reference,
    }),
  });
}

export async function finalizeTransfer(transferCode: string, otp: string): Promise<TransferResult> {
  return api<TransferResult>("/transfer/finalize_transfer", {
    method: "POST",
    body: JSON.stringify({ transfer_code: transferCode, otp }),
  });
}
