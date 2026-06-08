import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, CalendarDays, CalendarRange, Loader2,
  Target, BookOpen, Users, Mic, Heart, Home, ArrowRight, FileText, MessageSquareQuote,
} from "lucide-react";
import { useMinistryPlans } from "@/hooks/useMinistryPlans";
import type { MinistryPlan } from "@/hooks/useMinistryPlans";
import { PlanDialog } from "@/components/planner/PlanDialog";
import { ReflectionDialog } from "@/components/planner/ReflectionDialog";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const SECTION_ICONS: Record<string, any> = {
  focus: Target, priorities: Target, commitments: BookOpen,
  visits_discipleship: Users, preaching_studies: Mic, prayer_devotional: Heart,
  family_rest: Home, goals: Target, next_steps: ArrowRight, observations: FileText,
};

const SECTION_LABELS: Record<string, string> = {
  focus: "Foco", priorities: "Prioridades", commitments: "Compromissos",
  visits_discipleship: "Visitas e Discipulado", preaching_studies: "Pregação e Estudos",
  prayer_devotional: "Oração e Devoção", family_rest: "Família e Descanso",
  goals: "Metas", next_steps: "Próximos Passos", observations: "Observações",
};

const DISPLAY_FIELDS = ["focus", "priorities", "commitments", "visits_discipleship", "preaching_studies", "prayer_devotional", "family_rest", "goals", "next_steps", "observations"] as const;

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="card-premium">
      <CardContent className="card-empty">
        <div className="card-icon-box !h-12 !w-12 mb-3">
          <Icon className="!h-6 !w-6" />
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground/80 mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan, onEdit, onDelete, onReflect }: { plan: MinistryPlan; onEdit: () => void; onDelete: () => void; onReflect: () => void }) {
  const filledSections = DISPLAY_FIELDS.filter((k) => (plan as any)[k]?.trim());
  const dateLabel = plan.plan_type === "semanal" && plan.week_start
    ? `Semana de ${format(parseISO(plan.week_start), "dd/MM/yyyy", { locale: ptBR })}`
    : plan.plan_type === "mensal" && plan.month
      ? format(new Date(plan.month + "-01"), "MMMM yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())
      : "";

  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs capitalize">{plan.plan_type}</Badge>
              {dateLabel && <span className="text-xs text-muted-foreground">{dateLabel}</span>}
            </div>
            <CardTitle className="font-heading text-base md:text-lg truncate">
              {plan.title || (plan.plan_type === "semanal" ? "Planejamento Semanal" : "Planejamento Mensal")}
            </CardTitle>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReflect} title="Reflexão">
              <MessageSquareQuote className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filledSections.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma seção preenchida ainda. Edite para começar a planejar.</p>
        ) : (
          <div className="grid gap-3">
            {filledSections.map((key) => {
              const Icon = SECTION_ICONS[key] || FileText;
              return (
                <div key={key} className="card-list-row">
                  <div className="card-icon-box"><Icon /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-heading font-medium text-muted-foreground uppercase tracking-wide">{SECTION_LABELS[key]}</p>
                    <p className="text-sm font-sans text-foreground whitespace-pre-line line-clamp-3">{(plan as any)[key]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {plan.reflection?.trim() && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex gap-2">
              <MessageSquareQuote className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reflexão</p>
                <p className="text-sm text-foreground/80 italic whitespace-pre-line line-clamp-3">{plan.reflection}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlannerMinisterial() {
  const plans = useMinistryPlans();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"semanal" | "mensal">("semanal");
  const [editPlan, setEditPlan] = useState<MinistryPlan | null>(null);
  const [reflectPlan, setReflectPlan] = useState<MinistryPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const weeklyPlans = (plans.data ?? []).filter((p) => p.plan_type === "semanal");
  const monthlyPlans = (plans.data ?? []).filter((p) => p.plan_type === "mensal");

  const openNew = (type: "semanal" | "mensal") => {
    setEditPlan(null);
    setDialogType(type);
    setDialogOpen(true);
  };

  const openEdit = (plan: MinistryPlan) => {
    setEditPlan(plan);
    setDialogType(plan.plan_type as any);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editPlan) {
        await plans.update.mutateAsync({ id: editPlan.id, ...data });
        toast({ title: "Planejamento atualizado" });
      } else {
        await plans.create.mutateAsync(data);
        toast({ title: "Planejamento criado" });
      }
      setDialogOpen(false);
      setEditPlan(null);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const handleReflection = async (text: string) => {
    if (!reflectPlan) return;
    try {
      await plans.update.mutateAsync({ id: reflectPlan.id, reflection: text });
      toast({ title: "Reflexão salva" });
      setReflectPlan(null);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await plans.remove.mutateAsync(deleteId);
      toast({ title: "Planejamento removido" });
    } catch { toast({ title: "Erro ao remover", variant: "destructive" }); }
    setDeleteId(null);
  };

  if (plans.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5 pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Planner Ministerial</h1>
        <p className="text-muted-foreground text-sm font-sans mt-1">
          Organize sua semana e seu mês com intencionalidade pastoral. Planeje, execute e reflita.
        </p>
      </div>

      {/* Pastoral guidance card */}
      <Card className="card-premium overflow-hidden" style={{ borderColor: "rgba(36,61,77,0.15)" }}>
        <CardContent className="p-4 flex gap-3 items-start">
          <div className="card-icon-box"><Heart /></div>
          <div className="text-sm text-foreground/80 font-sans">
            <p className="font-heading font-semibold mb-1">Uma palavra para sua semana</p>
            <p className="italic text-muted-foreground">
              "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio." — Salmo 90.12
            </p>
            <p className="mt-1.5 text-muted-foreground">
              Planejar o ministério não é apenas organizar tarefas — é discernir onde Deus quer que você esteja presente.
              Reserve um momento para ouvir antes de planejar.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="semanal" className="w-full">
        <TabsList className="w-full flex h-auto gap-1">
          <TabsTrigger value="semanal" className="flex-1 gap-1.5">
            <CalendarDays className="h-4 w-4" /> Semanal
          </TabsTrigger>
          <TabsTrigger value="mensal" className="flex-1 gap-1.5">
            <CalendarRange className="h-4 w-4" /> Mensal
          </TabsTrigger>
        </TabsList>

        {/* Weekly */}
        <TabsContent value="semanal" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openNew("semanal")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Plano Semanal
            </Button>
          </div>
          {weeklyPlans.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum planejamento semanal"
              description="Crie seu primeiro planejamento semanal. Reserve alguns minutos na segunda-feira para organizar a semana com propósito."
            />
          ) : (
            <div className="space-y-4">
              {weeklyPlans.map((p) => (
                <PlanCard key={p.id} plan={p} onEdit={() => openEdit(p)} onDelete={() => setDeleteId(p.id)} onReflect={() => setReflectPlan(p)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Monthly */}
        <TabsContent value="mensal" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openNew("mensal")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Plano Mensal
            </Button>
          </div>
          {monthlyPlans.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Nenhum planejamento mensal"
              description="Planeje o mês com visão ampla. Identifique os compromissos maiores, as metas do ministério e o que Deus tem colocado em seu coração."
            />
          ) : (
            <div className="space-y-4">
              {monthlyPlans.map((p) => (
                <PlanCard key={p.id} plan={p} onEdit={() => openEdit(p)} onDelete={() => setDeleteId(p.id)} onReflect={() => setReflectPlan(p)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PlanDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditPlan(null); }}
        initial={editPlan}
        planType={dialogType}
        onSave={handleSave}
        saving={plans.create.isPending || plans.update.isPending}
      />

      {reflectPlan && (
        <ReflectionDialog
          open={!!reflectPlan}
          onOpenChange={(v) => !v && setReflectPlan(null)}
          currentReflection={reflectPlan.reflection ?? ""}
          onSave={handleReflection}
          saving={plans.update.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Remover planejamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
