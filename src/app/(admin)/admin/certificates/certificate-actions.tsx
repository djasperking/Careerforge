"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revokeCertificate, restoreCertificate } from "./actions";

export function CertificateActions({ id, revoked }: { id: string; revoked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => start(async () => {
        if (revoked) await restoreCertificate(id);
        else await revokeCertificate(id);
        router.refresh();
      })}
    >
      {revoked ? "Restore" : "Revoke"}
    </Button>
  );
}
