import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, CalendarDays, Users, Heart, BookOpen, Church,
  Wallet, FileText, Filter, Download, CheckSquare, Mic, TrendingUp, TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ReportCategory = "all" | "pastoral" | "visitas" | "reunioes" | "devocionais" | "cultos" | "financeiro" | "pregacoes";

const REPORT_SECTIONS: { key: Exclude<ReportCategory, "all">; label: string; icon: LucideIcon }[] = [
  { key: "pastoral", label: "Atividades Pastorais", icon: CalendarDays },
  { key: "visitas", label: "Visitas", icon: Heart },
  { key: "reunioes", label: "Reuniões", icon: Users },
  { key: "devocionais", label: "Devocionais", icon: BookOpen },
  { key: "cultos", label: "Cultos", icon: Church },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "pregacoes", label: "Pregações", icon: Mic },
];

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const { session } = useAuth();
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [filter, setFilter] = useState<ReportCategory>("all");

  const start = useMemo(() => parseISO(startDate), [startDate]);
  const end = useMemo(() => {
    const d = parseISO(endDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [endDate]);

  // Fetch all data in parallel
  const { data: events = [] } = useQuery({
    queryKey: ["report-events", startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*")
        .gte("start_time", startDate)
        .lte("start_time", endDate + "T23:59:59");
      return data || [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["report-tasks", startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*");
      return (data || []).filter((t) => {
        if (t.due_date) return isWithinInterval(parseISO(t.due_date), { start, end });
        return isWithinInterval(parseISO(t.created_at), { start, end });
      });
    },
  });

  const { data: financial = [] } = useQuery({
    queryKey: ["report-financial", startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("financial_entries").select("*");
      return (data || []).filter((e) => {
        const ref = e.due_date ? parseISO(e.due_date) : parseISO(e.created_at);
        return isWithinInterval(ref, { start, end });
      });
    },
  });

  const { data: sermons = [] } = useQuery({
    queryKey: ["report-sermons", startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("sermons").select("*");
      return (data || []).filter((s) => {
        const ref = s.sermon_date ? parseISO(s.sermon_date) : parseISO(s.created_at);
        return isWithinInterval(ref, { start, end });
      });
    },
  });

  // Derived stats
  const eventsByCategory = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const e of events) {
      const cat = e.category || "Outro";
      if (!map[cat]) map[cat] = [];
      map[cat].push(e);
    }
    return map;
  }, [events]);

  const visitas = eventsByCategory["Visita Pastoral"] || [];
  const reunioes = [...(eventsByCategory["Reunião da Igreja"] || []), ...(eventsByCategory["Reunião Pessoal"] || [])];
  const devocionais = [...(eventsByCategory["Devocional"] || []), ...(eventsByCategory["Sala de Oração"] || [])];
  const cultos = eventsByCategory["Culto"] || [];

  const totalReceitas = financial.filter((e) => e.entry_type === "receita").reduce((s, e) => s + Number(e.amount), 0);
  const totalDespesas = financial.filter((e) => e.entry_type === "despesa").reduce((s, e) => s + Number(e.amount), 0);

  const tasksDone = tasks.filter((t) => t.status === "concluido");
  const tasksPending = tasks.filter((t) => t.status !== "concluido");

  const visibleSections = filter === "all" ? REPORT_SECTIONS : REPORT_SECTIONS.filter((s) => s.key === filter);

  const periodLabel = (() => {
    try {
      return `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM yyyy", { locale: ptBR })}`;
    } catch { return ""; }
  })();

  const handleQuickRange = (months: number) => {
    const ref = subMonths(now, months === 0 ? 0 : months - 1);
    setStartDate(format(startOfMonth(months === 0 ? now : ref), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
  };

  const renderSection = (key: string) => {
    switch (key) {
      case "pastoral":
        return <PastoralSection events={events} tasks={tasks} tasksDone={tasksDone} tasksPending={tasksPending} />;
      case "visitas":
        return <EventListSection items={visitas} emptyHint="Registre visitas na Agenda com a categoria 'Visita Pastoral'." />;
      case "reunioes":
        return <EventListSection items={reunioes} emptyHint="Registre reuniões na Agenda para que apareçam aqui." />;
      case "devocionais":
        return <EventListSection items={devocionais} emptyHint="Registre devocionais na Agenda com a categoria 'Devocional' ou 'Sala de Oração'." />;
      case "cultos":
        return <EventListSection items={cultos} emptyHint="Registre cultos na Agenda com a categoria 'Culto'." />;
      case "financeiro":
        return <FinanceSection entries={financial} totalReceitas={totalReceitas} totalDespesas={totalDespesas} />;
      case "pregacoes":
        return <SermonsSection sermons={sermons} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Relatórios</h1>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtros
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={filter} onValueChange={(v) => setFilter(v as ReportCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {REPORT_SECTIONS.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickRange(0)}>Este mês</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickRange(3)}>Últimos 3 meses</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleQuickRange(6)}>Últimos 6 meses</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={CalendarDays} label="Compromissos" value={String(events.length)} />
        <SummaryCard icon={Heart} label="Visitas" value={String(visitas.length)} />
        <SummaryCard icon={Church} label="Cultos" value={String(cultos.length)} />
        <SummaryCard icon={Mic} label="Pregações" value={String(sermons.length)} />
      </div>

      {periodLabel && (
        <p className="text-xs text-muted-foreground">
          Período: <span className="font-medium text-foreground">{periodLabel}</span>
        </p>
      )}

      {/* Report sections */}
      <div className="space-y-4">
        {visibleSections.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Icon className="h-4.5 w-4.5 text-primary" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderSection(key)}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Os relatórios são gerados automaticamente a partir dos dados da Agenda, Tarefas, Financeiro e Pregações.
      </p>
    </div>
  );
}

/* ─── Sub-components ─── */

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptySection({ hint }: { hint: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-8 flex flex-col items-center text-center px-4">
      <p className="text-sm text-muted-foreground">Nenhum registro neste período.</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">{hint}</p>
    </div>
  );
}

function PastoralSection({ events, tasks, tasksDone, tasksPending }: {
  events: any[]; tasks: any[]; tasksDone: any[]; tasksPending: any[];
}) {
  if (events.length === 0 && tasks.length === 0) {
    return <EmptySection hint="Registre compromissos na Agenda e tarefas no módulo de Tarefas para gerar este resumo." />;
  }

  // Group events by category
  const catCounts: Record<string, number> = {};
  for (const e of events) {
    const cat = e.category || "Outro";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniStat icon={CalendarDays} label="Compromissos" value={events.length} />
        <MiniStat icon={CheckSquare} label="Tarefas concluídas" value={tasksDone.length} />
        <MiniStat icon={BarChart3} label="Tarefas pendentes" value={tasksPending.length} />
      </div>

      {Object.keys(catCounts).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Por categoria:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <span key={cat} className="inline-flex items-center gap-1 text-xs bg-accent/50 text-foreground px-2.5 py-1 rounded-full">
                {cat} <span className="font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventListSection({ items, emptyHint }: { items: any[]; emptyHint: string }) {
  if (items.length === 0) return <EmptySection hint={emptyHint} />;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{items.length} registro{items.length !== 1 ? "s" : ""} no período</p>
      <div className="space-y-1">
        {items.slice(0, 10).map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm rounded-md px-3 py-2 bg-accent/20">
            <span className="font-medium truncate flex-1">{item.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(item.start_time), "d MMM", { locale: ptBR })}
            </span>
            {item.location && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{item.location}</span>}
          </div>
        ))}
        {items.length > 10 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            e mais {items.length - 10} registro{items.length - 10 !== 1 ? "s" : ""}…
          </p>
        )}
      </div>
    </div>
  );
}

function FinanceSection({ entries, totalReceitas, totalDespesas }: {
  entries: any[]; totalReceitas: number; totalDespesas: number;
}) {
  if (entries.length === 0) {
    return <EmptySection hint="Registre receitas e despesas no módulo Financeiro para gerar este resumo." />;
  }

  const paid = entries.filter((e) => e.paid).length;
  const pending = entries.length - paid;

  // Category breakdown
  const byCat: Record<string, { receita: number; despesa: number }> = {};
  for (const e of entries) {
    const cat = e.category || "Outro";
    if (!byCat[cat]) byCat[cat] = { receita: 0, despesa: 0 };
    byCat[cat][e.entry_type as "receita" | "despesa"] += Number(e.amount);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp} label="Receitas" value={currency(totalReceitas)} color="text-emerald-600" />
        <MiniStat icon={TrendingDown} label="Despesas" value={currency(totalDespesas)} color="text-red-600" />
        <MiniStat icon={Wallet} label="Saldo" value={currency(totalReceitas - totalDespesas)}
          color={totalReceitas - totalDespesas >= 0 ? "text-emerald-600" : "text-red-600"} />
        <MiniStat icon={CheckSquare} label="Pagos / Pendentes" value={`${paid} / ${pending}`} />
      </div>

      {Object.keys(byCat).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Por categoria:</p>
          <div className="space-y-1">
            {Object.entries(byCat).map(([cat, totals]) => (
              <div key={cat} className="flex items-center justify-between text-sm px-3 py-1.5 bg-accent/20 rounded-md">
                <span className="font-medium">{cat}</span>
                <div className="flex gap-3 text-xs">
                  {totals.receita > 0 && <span className="text-emerald-600">+{currency(totals.receita)}</span>}
                  {totals.despesa > 0 && <span className="text-red-600">−{currency(totals.despesa)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SermonsSection({ sermons }: { sermons: any[] }) {
  if (sermons.length === 0) {
    return <EmptySection hint="Registre pregações no módulo de Pregações para que apareçam aqui." />;
  }

  const byStatus: Record<string, number> = {};
  for (const s of sermons) {
    const st = s.status || "rascunho";
    byStatus[st] = (byStatus[st] || 0) + 1;
  }

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    preparado: "Preparado",
    pregado: "Pregado",
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{sermons.length} pregaç{sermons.length !== 1 ? "ões" : "ão"} no período</p>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(byStatus).map(([status, count]) => (
          <span key={status} className="inline-flex items-center gap-1 text-xs bg-accent/50 text-foreground px-2.5 py-1 rounded-full">
            {statusLabels[status] || status} <span className="font-semibold">{count}</span>
          </span>
        ))}
      </div>
      <div className="space-y-1">
        {sermons.slice(0, 8).map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm rounded-md px-3 py-2 bg-accent/20">
            <span className="font-medium truncate flex-1">{s.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {s.sermon_date ? format(parseISO(s.sermon_date), "d MMM", { locale: ptBR }) : "Sem data"}
            </span>
            {s.church_name && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{s.church_name}</span>}
          </div>
        ))}
        {sermons.length > 8 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            e mais {sermons.length - 8} pregaç{sermons.length - 8 !== 1 ? "ões" : "ão"}…
          </p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/20">
      <Icon className={`h-4 w-4 shrink-0 ${color || "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        <p className={`text-sm font-bold ${color || "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}
