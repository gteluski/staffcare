import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, Clock, Loader2, Shield,
  Calendar, BookOpen, FileText, BarChart3, Brain, Smartphone,
  ListTodo, BookMarked,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { StripeEmbeddedCheckout } from "@/components/subscription/StripeEmbeddedCheckout";
import { STAFF_CARE_PRICE_ID } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const MONTHLY_PRICE = "R$ 79,90";

const FEATURES = [
  { icon: Calendar, text: "Agenda e calendário pastoral" },
  { icon: ListTodo, text: "Planejamento e organização da rotina" },
  { icon: BookOpen, text: "Pregações e modo pregação" },
  { icon: FileText, text: "Biblioteca e documentos na nuvem" },
  { icon: BarChart3, text: "Relatórios e visão da rotina" },
  { icon: BookMarked, text: "Bíblia integrada" },
  { icon: Brain, text: "Assistente pastoral com IA" },
  { icon: Smartphone, text: "Acesso em celular, tablet e computador" },
];

export default function Assinatura() {
  const { user } = useAuth();
  const {
    subscription, isLoading, isTrialing, isActive,
    trialExpired, trialDaysLeft, cancelScheduled,
  } = useSubscription();
  const [showCheckout, setShowCheckout] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const needsSubscription = !isActive && !isTrialing;

  const handleManage = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/assinatura`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Não foi possível abrir o portal");
      window.open(data.url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-muted-foreground">
          Assinatura
        </p>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
          {needsSubscription ? "Ative sua assinatura" : "Minha Assinatura"}
        </h1>
        <p className="text-sm font-sans text-muted-foreground max-w-md mx-auto leading-relaxed">
          {needsSubscription
            ? "Continue utilizando sua plataforma pastoral com acesso completo aos recursos."
            : "Gerencie seu plano e acompanhe o status da sua assinatura."}
        </p>
      </motion.div>

      {isTrialing && !trialExpired && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: "rgba(36,61,77,0.04)", borderColor: "rgba(36,61,77,0.1)" }}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(36,61,77,0.08)" }}>
              <Clock className="h-4 w-4" style={{ color: "#243d4d" }} />
            </div>
            <span className="text-sm font-heading font-semibold" style={{ color: "#243d4d" }}>
              Período gratuito ativo
            </span>
          </div>
          <p className="text-sm font-sans text-muted-foreground pl-10">
            Você tem{" "}
            <strong style={{ color: "#243d4d" }}>
              {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
            </strong>{" "}
            de uso gratuito.
            {subscription?.trial_end && (
              <> Termina em{" "}
                <strong style={{ color: "#243d4d" }}>
                  {format(new Date(subscription.trial_end), "dd 'de' MMMM", { locale: ptBR })}
                </strong>.
              </>
            )}
          </p>
        </motion.div>
      )}

      {isActive && !cancelScheduled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 border border-emerald-200 bg-emerald-50"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-heading font-semibold text-emerald-700">
              Assinatura ativa
            </span>
          </div>
          <p className="text-sm font-sans text-muted-foreground pl-10">
            Seu acesso está garantido até{" "}
            <strong className="text-foreground">
              {subscription?.paid_until &&
                format(new Date(subscription.paid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </strong>.
          </p>
        </motion.div>
      )}

      {isActive && cancelScheduled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 border border-amber-200 bg-amber-50"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm font-heading font-semibold text-amber-700">
              Cancelamento agendado
            </span>
          </div>
          <p className="text-sm font-sans text-muted-foreground pl-10">
            Sua assinatura será encerrada em{" "}
            <strong className="text-foreground">
              {subscription?.paid_until &&
                format(new Date(subscription.paid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </strong>
            . Você continua com acesso completo até essa data. Para reativar, abra o portal abaixo.
          </p>
        </motion.div>
      )}

      {trialExpired && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 border border-amber-200 bg-amber-50"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm font-heading font-semibold text-amber-700">
              Período gratuito expirado
            </span>
          </div>
          <p className="text-sm font-sans text-muted-foreground pl-10">
            Seu período de 7 dias gratuitos terminou. Ative sua assinatura para continuar usando a plataforma.
          </p>
        </motion.div>
      )}

      {/* Embedded checkout */}
      {showCheckout && !isActive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-card p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold text-foreground">
              Pagamento seguro
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
          </div>
          <StripeEmbeddedCheckout
            priceId={STAFF_CARE_PRICE_ID}
            customerEmail={user?.email ?? undefined}
            userId={user?.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </motion.div>
      )}

      {/* Pricing card */}
      {!showCheckout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="pricing-card"
        >
          <div
            className="px-6 sm:px-8 py-6 text-center"
            style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
          >
            <p className="text-[10px] font-heading uppercase tracking-[0.25em] text-white/40 mb-2">
              Plano único
            </p>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight">
              Plano Staff Care
            </h2>
            <p className="text-sm font-sans text-white/55 mt-1.5">
              Tudo o que o ministério pastoral precisa, em um só lugar.
            </p>
          </div>

          <div className="bg-card px-6 sm:px-8 py-8 space-y-7">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-heading font-bold text-foreground tracking-tight">
                  {MONTHLY_PRICE}
                </span>
                <span className="text-sm font-sans text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs font-sans text-muted-foreground mt-2">
                por usuário · após 7 dias gratuitos
              </p>
            </div>

            <div className="border-t border-border/40" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(36,61,77,0.06)" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: "#243d4d" }} />
                  </div>
                  <span className="text-sm font-sans text-foreground/80">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border/40" />

            {!isActive && (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-heading rounded-2xl btn-premium"
                  style={{ backgroundColor: "#243d4d", color: "#f1f1f1" }}
                  onClick={() => setShowCheckout(true)}
                >
                  Assinar agora
                </Button>
                <p className="text-xs text-center font-sans text-muted-foreground">
                  Pagamento seguro processado pela Stripe. Cancele quando quiser.
                </p>
              </div>
            )}

            {isActive && (
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base font-heading rounded-2xl"
                  onClick={handleManage}
                  disabled={openingPortal}
                >
                  {openingPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Gerenciar assinatura"
                  )}
                </Button>
                <p className="text-xs text-center font-sans text-muted-foreground">
                  Atualize forma de pagamento, baixe faturas ou cancele sua assinatura.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-2.5 text-xs font-sans text-muted-foreground pb-4">
        <Shield className="h-3.5 w-3.5" />
        <span>Pagamentos processados com segurança e privacidade pela Stripe.</span>
      </div>
    </div>
  );
}
