import { requirePermissionPage } from "@/lib/session";
import { AdminStub } from "@/components/layout/admin-stub";

export const metadata = { title: "Content" };

export default async function AdminContentPage() {
  await requirePermissionPage("content:write");
  return (
    <AdminStub
      title="Content management"
      description="Marketing pages, blog and policies."
      phase="a future CMS pass"
      scope={[
        "Homepage sections, About, FAQ, Contact",
        "Blog / articles and career resources",
        "Terms, Privacy policy, Refund policy",
        "Structured content blocks with draft/publish",
      ]}
    />
  );
}
