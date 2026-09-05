"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleTemplateActive, toggleTemplatePremium } from "./actions";

export function TemplateToggles({
  id, isActive, isPremium,
}: {
  id: string;
  isActive: boolean;
  isPremium: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-3 flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => start(() => toggleTemplateActive(id, !isActive))}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => start(() => toggleTemplatePremium(id, !isPremium))}
      >
        {isPremium ? "Mark standard" : "Mark premium"}
      </Button>
    </div>
  );
}
