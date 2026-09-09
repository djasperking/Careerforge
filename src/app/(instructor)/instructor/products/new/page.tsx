import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { bunnyEnabled } from "@/lib/video/bunny";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireUser();

  return (
    <div>
      <PageHeader title="New digital product" description="Sell an ebook, template or resource. You can refine everything before submitting it for review." />
      <Card>
        <CardContent className="p-6">
          <ProductForm hostedVideoEnabled={bunnyEnabled()} />
        </CardContent>
      </Card>
    </div>
  );
}
