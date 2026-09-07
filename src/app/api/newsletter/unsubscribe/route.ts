import { unsubscribeByToken } from "@/lib/newsletter/service";
import { appUrl } from "@/lib/email";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = token ? await unsubscribeByToken(token) : false;
  return Response.redirect(appUrl(`/newsletter?u=${ok ? "1" : "0"}`), 302);
}
