import { unsubscribeJobAlerts } from "@/lib/jobs/alerts";
import { appUrl } from "@/lib/email";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = token ? await unsubscribeJobAlerts(token) : false;
  return Response.redirect(appUrl(`/jobs/today?alerts=${ok ? "off" : "err"}`), 302);
}
