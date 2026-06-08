import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays, CheckSquare, BookOpen, Bot, FileText, BarChart3,
  ArrowRight, ArrowLeft, Church, Sparkles, User, Heart,
  PenTool, DollarSign, BookMarked, LayoutDashboard, CheckCircle,
} from "lucide-react";
import staffLogoDark from "@/assets/staff-logo-dark.png";

const MODULES_PREVIEW = [
  { icon: CalendarDays, name: "Agenda", desc: "Compromissos, calendário litúrgico e datas metodistas" },
  { icon: CheckSquare, name: "Tarefas", desc: "Visitas, reuniões e pendências pastorais" },
  { icon: BookOpen, name: "Pregações", desc: "Esboce, desenvolva e organize seus sermões" },
  { icon: FileText, name: "Biblioteca", desc: "Atas, relatórios, estudos e documentos" },
  { icon: PenTool, name: "Editor", desc: "Textos pastorais com editor rico" },
  { icon: BarChart3, name: "Relatórios", desc: "Prestação de contas e relatórios pastorais" },
  { icon: DollarSign, name: "Financeiro", desc: "Dízimos, ofertas e despesas" },
  { icon: BookMarked, name: "Bíblia", desc: "Consulta integrada às Escrituras" },
  { icon: Bot, name: "Assistente", desc: "IA com base wesleyana e metodista" },
];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    pastoral_title: profile?.pastoral_title || "Pastor",
    church_name: profile?.church_name || "",
    district: profile?.district || "",
    region: profile?.region || "",
  });

  const totalSteps = 7;

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { updateMyProfile } = await import("@/lib/profile-security");
    try {
      await updateMyProfile({
        full_name: form.full_name,
        phone: "",
        pastoral_title: form.pastoral_title,
        church_name: form.church_name,
        district: form.district,
        region: form.region,
      });
    } catch (e) {
      console.error("Failed to save profile during onboarding", e);
    }
    setSaving(false);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    const session = (await supabase.auth.getSession()).data.session;
    await supabase.functions.invoke("update-profile-flags", {
      body: { flag: "complete_onboarding" },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    await refreshProfile();
    setSaving(false);
    navigate("/dashboard");
  };

  const skip = async () => {
    await completeOnboarding();
  };

  const next = async () => {
    if (step === 2) await saveProfile();
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const goTo = async (path: string) => {
    await completeOnboarding();
    navigate(path);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" >
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Skip */}
      {step < totalSteps - 1 && (
        <div className="flex justify-end px-4 sm:px-6 pt-4">
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={saving}
          >
            Pular por agora
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg">

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center animate-in fade-in duration-500">
              <img src={staffLogoDark} alt="Staff care" className="h-16 mx-auto mb-8 opacity-90" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
                Seja bem-vindo(a) à sua plataforma pastoral.
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
                Aqui você poderá organizar sua rotina, seus compromissos, suas pregações, seus documentos e sua caminhada ministerial com mais clareza.
              </p>
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Pensado para pastores e pastoras</span>
              </div>
            </div>
          )}

          {/* ── Step 1: Main modules ── */}
          {step === 1 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Tudo o que você precisa em um só lugar.
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Agenda, tarefas, biblioteca, editor, pregações, relatórios, finanças, Bíblia e apoio pastoral em uma experiência simples e organizada.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {MODULES_PREVIEW.map((m) => (
                  <div key={m.name} className="flex flex-col items-center text-center p-3 rounded-xl bg-card border border-border">
                    <div className="h-9 w-9 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-2">
                      <m.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Complete profile ── */}
          {step === 2 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Vamos personalizar sua experiência.
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Complete seu perfil pastoral para que a plataforma se adapte melhor ao seu contexto ministerial.
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground/80">Nome completo</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="João da Silva"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/80">Título pastoral</Label>
                  <select
                    value={form.pastoral_title}
                    onChange={(e) => setForm({ ...form, pastoral_title: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
                  >
                    <option value="Pastor">Pastor</option>
                    <option value="Pastora">Pastora</option>
                    <option value="Reverendo">Reverendo</option>
                    <option value="Reverenda">Reverenda</option>
                    <option value="Bispo">Bispo</option>
                    <option value="Bispa">Bispa</option>
                    <option value="Presbítero">Presbítero</option>
                    <option value="Presbítera">Presbítera</option>
                    <option value="Diácono">Diácono</option>
                    <option value="Diácona">Diácona</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/80">Igreja local</Label>
                  <Input
                    value={form.church_name}
                    onChange={(e) => setForm({ ...form, church_name: e.target.value })}
                    placeholder="Igreja Metodista Central"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground/80">Distrito</Label>
                    <Input
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      placeholder="1º DE"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground/80">Região</Label>
                    <Input
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="1ª RE"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Você pode alterar essas informações depois em Meu Perfil.</p>
            </div>
          )}

          {/* ── Step 3: Start with agenda ── */}
          {step === 3 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Sua rotina começa pela agenda.
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Cadastre seus compromissos, cultos, visitas, reuniões e datas importantes para acompanhar melhor sua semana.
              </p>

              <button
                onClick={() => goTo("/agenda")}
                disabled={saving}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left w-full group mb-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <CalendarDays className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Criar meu primeiro compromisso</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {/* ── Step 4: Organize ministry ── */}
          {step === 4 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Planeje com mais intencionalidade.
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Use a agenda, o planner e a jornada ministerial para acompanhar sua caminhada, organizar sua semana e registrar experiências importantes do ministério.
              </p>

              <div className="space-y-3">
                {[
                  { icon: CheckSquare, label: "Explorar tarefas", path: "/tarefas" },
                  { icon: LayoutDashboard, label: "Abrir planner ministerial", path: "/planner" },
                ].map((a) => (
                  <button
                    key={a.path}
                    onClick={() => goTo(a.path)}
                    disabled={saving}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left w-full group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                      <a.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{a.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Pastoral assistant ── */}
          {step === 5 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Conte com apoio no seu dia a dia.
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                O Assistente Pastoral pode ajudar em estudos, organização, planejamento e reflexões com linguagem pastoral e base metodista.
              </p>

              <button
                onClick={() => goTo("/assistente")}
                disabled={saving}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left w-full group mb-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <Bot className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Conversar com o assistente</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {/* ── Step 6: Final ── */}
          {step === 6 && (
            <div className="text-center animate-in fade-in duration-500">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Tudo pronto para começar.
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-2 max-w-md mx-auto">
                Que esta plataforma seja uma ferramenta útil, leve e abençoadora para sua caminhada ministerial.
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
                No seu dashboard, você encontrará um guia de primeiros passos para ajudá-lo(a) a explorar cada recurso.
              </p>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-10 gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={next}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-11"
            >
              {saving
                ? "Salvando..."
                : step === 0
                  ? "Começar"
                  : step === totalSteps - 1
                    ? "Ir para o dashboard"
                    : "Continuar"}
              {!saving && step < totalSteps - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
