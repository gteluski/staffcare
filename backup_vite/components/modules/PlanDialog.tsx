import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, BookOpen, Users, Mic, Heart, Home, ArrowRight, FileText } from "lucide-react";
import type { MinistryPlan } from "@/hooks/useMinistryPlans";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MinistryPlan | null;
  planType: "semanal" | "mensal";
  onSave: (data: Omit<MinistryPlan, "id" | "user_id" | "created_at" | "updated_at">) => void;
  saving?: boolean;
}

const SECTION_CONFIG = [
  { key: "focus", label: "Foco do Período", icon: Target, placeholder: "Qual é o foco principal desta semana/mês no ministério?", hint: "\"Onde colocarei minha energia e atenção pastoral?\"" },
  { key: "priorities", label: "Prioridades Pastorais", icon: Target, placeholder: "Quais são as prioridades pastorais deste período?", hint: "Pessoas para acompanhar, situações que precisam de atenção" },
  { key: "commitments", label: "Compromissos-Chave", icon: BookOpen, placeholder: "Reuniões, cultos, eventos, prazos importantes...", hint: "O que não pode ser esquecido ou adiado" },
  { key: "visits_discipleship", label: "Visitas e Discipulado", icon: Users, placeholder: "Visitas pastorais, acompanhamento de novos convertidos, classes...", hint: "\"Apascentai o rebanho de Deus\" (1 Pe 5.2)" },
  { key: "preaching_studies", label: "Pregação e Estudos", icon: Mic, placeholder: "Sermões a preparar, textos bíblicos a estudar, leituras...", hint: "Preparação espiritual e intelectual para a Palavra" },
  { key: "prayer_devotional", label: "Oração e Vida Devocional", icon: Heart, placeholder: "Tempo de oração, jejum, meditação, vigílias...", hint: "\"Orai sem cessar\" — a vida devocional sustenta o ministério" },
  { key: "family_rest", label: "Família e Descanso", icon: Home, placeholder: "Tempo com a família, lazer, dia de folga, autocuidado...", hint: "Pastores também precisam de graça e descanso" },
  { key: "goals", label: "Metas Espirituais e Ministeriais", icon: Target, placeholder: "Metas para este período: espirituais, de crescimento, do ministério...", hint: "Metas claras ajudam a caminhar com propósito" },
  { key: "next_steps", label: "Próximos Passos", icon: ArrowRight, placeholder: "O que vem depois? Encaminhamentos, decisões pendentes...", hint: "Planeje os próximos passos com sabedoria" },
  { key: "observations", label: "Observações", icon: FileText, placeholder: "Notas, lembretes, ideias soltas...", hint: "" },
] as const;

type FieldKey = typeof SECTION_CONFIG[number]["key"];

export function PlanDialog({ open, onOpenChange, initial, planType, onSave, saving }: Props) {
  const [title, setTitle] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [month, setMonth] = useState("");
  const [fields, setFields] = useState<Record<FieldKey, string>>({} as any);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setWeekStart(initial?.week_start ?? "");
      setMonth(initial?.month ?? "");
      const f: any = {};
      SECTION_CONFIG.forEach((s) => { f[s.key] = (initial as any)?.[s.key] ?? ""; });
      setFields(f);
    }
  }, [open, initial]);

  const setField = (key: FieldKey, val: string) => setFields((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    onSave({
      plan_type: planType,
      week_start: planType === "semanal" ? (weekStart || null) : null,
      month: planType === "mensal" ? (month || null) : null,
      title,
      ...fields,
      reflection: (initial as any)?.reflection ?? "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] p-0 flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="font-heading">
            {initial ? "Editar Planejamento" : `Novo Planejamento ${planType === "semanal" ? "Semanal" : "Mensal"}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5">
          <div className="grid gap-5 py-2 pb-4">
            {/* Title + date */}
            <div className="space-y-1.5">
              <Label>Título (opcional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={planType === "semanal" ? "Ex: Semana de preparação pascal" : "Ex: Abril — mês missionário"} />
            </div>

            {planType === "semanal" ? (
              <div className="space-y-1.5">
                <Label>Início da Semana</Label>
                <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Mês</Label>
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
            )}

            {/* Planning sections */}
            {SECTION_CONFIG.map((sec) => (
              <div key={sec.key} className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <sec.icon className="h-4 w-4 text-primary/70" />
                  {sec.label}
                </Label>
                {sec.hint && <p className="text-xs text-muted-foreground italic">{sec.hint}</p>}
                <Textarea
                  rows={3}
                  value={fields[sec.key] ?? ""}
                  onChange={(e) => setField(sec.key, e.target.value)}
                  placeholder={sec.placeholder}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="px-5 pb-5 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
