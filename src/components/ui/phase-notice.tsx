import { Rocket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Honest marker for a screen whose full behaviour lands in a later build phase.
 * The surrounding page still shows real data (counts, lists, empty states) — it
 * is a shell, not a fake dashboard.
 */
export function PhaseNotice({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <Alert variant="info" className="mb-6">
      <Rocket className="size-4" />
      <AlertTitle>Delivered in {phase}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
