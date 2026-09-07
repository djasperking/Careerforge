import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SharePanel } from "@/components/ui/share-panel";
import { ProductForm } from "../product-form";
import { ProductReviewPanel } from "./review-panel";

export default async function InstructorProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") redirect("/instructor");

  const { id } = await params;
  const product = await db.digitalProduct.findFirst({
    where: { id, sellerId: user.id },
    include: { _count: { select: { purchases: true } } },
  });
  if (!product) notFound();

  const locked = product.reviewStatus === "SUBMITTED";

  return (
    <div>
      <PageHeader
        title={product.title}
        description={`${product._count.purchases} sold · ${product.status === "PUBLISHED" ? "Live" : "Not live"}`}
      />

      <ProductReviewPanel
        productId={product.id}
        reviewStatus={product.reviewStatus}
        publishStatus={product.status}
        reviewNote={product.reviewNote}
        revenueSharePercent={product.revenueSharePercent}
        shareUrl={appUrl(`/products/${product.slug}`)}
      />

      {product.reviewStatus === "APPROVED" ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>Share your product</CardTitle></CardHeader>
          <CardContent>
            <SharePanel
              url={appUrl(`/products/${product.slug}`)}
              intro={
                product.status === "PUBLISHED"
                  ? "Your product is live. Share this link — buyers can pay without creating an account and get the file by email."
                  : "Your product is approved. Publish it to make this link live, then share it anywhere."
              }
              shareText={`"${product.title}" on Career Forge`}
            />
          </CardContent>
        </Card>
      ) : null}

      {locked ? (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>This product is awaiting review</AlertTitle>
          <AlertDescription>You can&apos;t edit it until a decision is made.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
        <CardContent>
          <ProductForm
            productId={product.id}
            locked={locked}
            initial={{
              title: product.title,
              description: product.description,
              coverImageUrl: product.coverImageUrl ?? "",
              deliveryType: product.deliveryType === "EXTERNAL_VIDEO" ? "EXTERNAL_VIDEO" : "FILE",
              fileUrl: product.fileUrl,
              fileName: product.fileName,
              fileSizeBytes: product.fileSizeBytes,
              videoUrl: product.videoUrl ?? "",
              priceCents: product.priceCents,
              currency: product.currency,
              discountPercent: product.discountPercent ?? 0,
              discountEndsAt: product.discountEndsAt ? product.discountEndsAt.toISOString().slice(0, 10) : "",
            }}
          />
        </CardContent>
      </Card>

      <p className="mt-6 text-sm">
        <Link href="/instructor/products" className="text-primary hover:underline">← Back to products</Link>
      </p>
    </div>
  );
}
