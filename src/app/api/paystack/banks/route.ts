import { requireUserApi } from "@/lib/session";
import { listBanks, transfersEnabled } from "@/lib/payments/transfers";

export const revalidate = 86400;

export async function GET() {
  await requireUserApi();
  if (!transfersEnabled()) return Response.json({ banks: [] });
  try {
    const banks = await listBanks("NGN");
    return Response.json({ banks });
  } catch {
    return Response.json({ banks: [] });
  }
}
