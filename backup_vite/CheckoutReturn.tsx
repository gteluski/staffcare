import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { isActive, refetch } = useSubscription();

  // Poll while we wait for the webhook to land (realtime should normally win first)
  useEffect(() => {
    if (isActive || !sessionId) return;
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    const stopAfter = setTimeout(() => clearInterval(interval), 60_000);
    return () => {
      clearInterval(interval);
      clearTimeout(stopAfter);
    };
  }, [isActive, sessionId, refetch]);

  if (!sessionId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Sessão de pagamento não encontrada.</p>
          <Button onClick={() => navigate("/assinatura")}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center space-y-6"
      >
        {isActive ? (
          <>
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Assinatura ativada
              </h1>
              <p className="text-sm font-sans text-muted-foreground">
                Tudo certo! Seu acesso completo à plataforma já está liberado.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/dashboard")} size="lg">
                Ir para o Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/assinatura")}>
                Ver minha assinatura
              </Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div className="space-y-2">
              <h1 className="text-xl font-heading font-bold text-foreground">
                Confirmando seu pagamento…
              </h1>
              <p className="text-sm font-sans text-muted-foreground">
                Isso costuma levar alguns segundos. Esta página atualiza
                automaticamente assim que sua assinatura for ativada.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
