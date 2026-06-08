'use client';

import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ExpiredTrialModal() {
  const { isLoading, hasAccess } = useSubscription();
  const router = useRouter();

  const shouldShow = !isLoading && !hasAccess;
  if (!shouldShow) return null;

  return (
    <Dialog open onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <style dangerouslySetInnerHTML={{ __html: `[data-radix-dialog-content] > button[class*="absolute"] { display: none !important; }` }} />
        <DialogHeader className="text-center sm:text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Seu período gratuito expirou
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Os 7 dias gratuitos da sua plataforma chegaram ao fim. Para continuar
            utilizando todos os recursos, é necessário ativar sua assinatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full text-base gap-2"
            onClick={() => router.push("/assinatura")}
          >
            Assinar agora
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Pagamento seguro processado pela Stripe. Seu acesso retorna assim que a assinatura for confirmada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
