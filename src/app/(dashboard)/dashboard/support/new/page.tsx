import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewTicketForm } from "../new-ticket-form";

export const metadata = { title: "New support ticket" };

export default function NewSupportTicketPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="New support ticket" />
      <Card>
        <CardContent className="p-6">
          <NewTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
