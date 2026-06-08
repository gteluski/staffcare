'use client';

import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrialBanner() {
  const { isLoading, isTrialing, isActive, trialDaysLeft } = useSubscription();
  const router = useRouter();

  if (isLoading || isActive) return null;

  if (isTrialing) {
    return (
      <div className="bg-primary/5 border-b border-primary/10 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            Período gratuito ·{" "}
            <strong>
              {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
            </strong>
          </span>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 text-xs h-7" onClick={() => router.push("/assinatura")}>
          Ver plano
        </Button>
      </div>
    );
  }

  // Trial expired
  return (
    <div className="bg-destructive/5 border-b border-destructive/15 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Seu período gratuito terminou. Assine para continuar.</span>
      </div>
      <Button size="sm" className="shrink-0 text-xs h-7" onClick={() => router.push("/assinatura")}>
        Assinar agora
      </Button>
    </div>
  );
}
