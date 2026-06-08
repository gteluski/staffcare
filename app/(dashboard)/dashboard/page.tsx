'use client';

import { useAuth } from "@/hooks/useAuth";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";
import { useLiturgicalSeason } from "@/hooks/useLiturgicalSeason";
import { getGreeting, getWeekdayName, getFormattedDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, isToday as isTodayFn } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sun,
  CalendarDays,
  CheckSquare,
  Clock,
  ListChecks,
  CalendarRange,
  Bot,
  Sunrise,
  Coffee,
  Moon,
  Mic,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { label: WEEKDAYS[i], day: d.getDate(), date: d, isToday: d.toDateString() === today.toDateString() };
  });
}

const routineSlots = [
  { icon: Sunrise, label: "Manhã", time: "6h – 12h", hint: "Devocional, estudo, visitas", color: "icon-box-amber" },
  { icon: Coffee, label: "Tarde", time: "12h – 18h", hint: "Reuniões, aconselhamento, preparação", color: "icon-box-orange" },
  { icon: Moon, label: "Noite", time: "18h – 22h", hint: "Cultos, grupos, família", color: "icon-box-indigo" },
];

const priorityColors: Record<string, string> = {
  alta: "bg-destructive/10 text-destructive border-destructive/20",
  média: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  baixa: "bg-muted text-muted-foreground border-border",
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const season = useLiturgicalSeason();
  const router = useRouter();
  const supabase = createClient();

  const greeting = getGreeting();
  const weekday = getWeekdayName();
  const formattedDate = getFormattedDate();
  const weekDates = getWeekDates();
  const title = profile?.pastoral_title || "Pastor";
  const firstName = profile?.full_name?.split(" ")[0] || "";

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).toISOString();

  const { data: todayEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["dashboard-today-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("events").select("*").eq("user_id", user.id)
        .gte("start_time", todayStart).lte("start_time", todayEnd)
        .order("start_time", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: upcomingEvents = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ["dashboard-upcoming-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("events").select("*").eq("user_id", user.id)
        .gte("start_time", now.toISOString())
        .order("start_time", { ascending: true }).limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: weekEvents = [] } = useQuery({
    queryKey: ["dashboard-week-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("events").select("start_time").eq("user_id", user.id)
        .gte("start_time", weekStart).lte("start_time", weekEnd);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: pendingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-pending-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("tasks").select("*").eq("user_id", user.id)
        .in("status", ["a_fazer", "em_andamento"])
        .order("priority", { ascending: true }).limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: nextSermon } = useQuery({
    queryKey: ["dashboard-next-sermon", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("sermons").select("*").eq("user_id", user.id)
        .gte("sermon_date", format(now, "yyyy-MM-dd"))
        .order("sermon_date", { ascending: true }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const highPriorityTasks = pendingTasks.filter((t) => t.priority === "alta");
  const todayTasks = pendingTasks.filter((t) => t.due_date && isTodayFn(parseISO(t.due_date)));
  const priorityDisplay = highPriorityTasks.length > 0 ? highPriorityTasks : todayTasks;

  const weekEventCounts = new Map<string, number>();
  weekEvents.forEach((e) => {
    const dayKey = format(parseISO(e.start_time), "yyyy-MM-dd");
    weekEventCounts.set(dayKey, (weekEventCounts.get(dayKey) || 0) + 1);
  });

  return (
    <div className="max-w-5xl space-y-5">
      {/* ── Greeting card ── */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <Card className="card-accent-top border-0 shadow-lg overflow-hidden">
          <CardContent className="py-6 px-6" style={{ backgroundColor: "#243d4d" }}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-tight text-white">
                  {greeting}, {title} {firstName}
                </h1>
                <p className="text-white/60 text-sm font-sans mt-1.5 capitalize">
                  {weekday}, {formattedDate}
                </p>
                <p className="text-white/35 text-xs font-sans mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${season.accentHsl})` }} />
                  {season.label} · {season.note}
                </p>
              </div>
              <Sun className="h-10 w-10 text-white/15 hidden sm:block shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Metric summary row (colorful icons) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: "Compromissos", value: loadingEvents ? "…" : String(todayEvents.length), sub: "hoje", color: "icon-box-blue", route: "/agenda" },
          { icon: CheckSquare, label: "Tarefas", value: loadingTasks ? "…" : String(pendingTasks.length), sub: "pendentes", color: "icon-box-emerald", route: "/tarefas" },
          { icon: Mic, label: "Pregação", value: nextSermon ? format(parseISO(nextSermon.sermon_date!), "dd/MM") : "—", sub: "próxima", color: "icon-box-violet", route: "/pregacoes" },
          { icon: Clock, label: "Agenda", value: loadingUpcoming ? "…" : String(upcomingEvents.length), sub: "próximos", color: "icon-box-amber", route: "/agenda" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            custom={i + 1}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <button
              type="button"
              onClick={() => router.push(m.route)}
              className="card-metric w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`icon-box ${m.color}`}>
                  <m.icon />
                </div>
                <span className="text-xs font-sans text-muted-foreground">{m.label}</span>
              </div>
              <p className="card-value">{m.value}</p>
              <p className="card-support mt-0.5">{m.sub}</p>
            </button>
          </motion.div>
        ))}
      </div>

      {/* ── Row: Priorities + Routine ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prioridades */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariant}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="card-section-title">
                  <div className="icon-box icon-box-rose"><ListChecks /></div>
                  Prioridades de hoje
                </CardTitle>
                {priorityDisplay.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-8 font-sans" onClick={() => router.push("/tarefas")}>
                    Ver todas <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : priorityDisplay.length > 0 ? (
                <ul className="space-y-2">
                  {priorityDisplay.slice(0, 5).map((t) => (
                    <li key={t.id} className="card-list-row">
                      <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-sans text-foreground flex-1 truncate">{t.title}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${priorityColors[t.priority] || ""}`}>
                        {t.priority}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="card-empty">
                  <ListChecks className="h-8 w-8 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-sans text-muted-foreground">Nenhuma prioridade definida para hoje.</p>
                  <p className="card-support mt-1">Suas tarefas de alta prioridade ou com vencimento hoje aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Rotina do dia */}
        <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariant}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="card-section-title">
                <div className="icon-box icon-box-amber"><Sunrise /></div>
                Rotina do dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {routineSlots.map((slot) => {
                const slotEvents = todayEvents.filter((ev) => {
                  const h = parseISO(ev.start_time).getHours();
                  if (slot.label === "Manhã") return h >= 6 && h < 12;
                  if (slot.label === "Tarde") return h >= 12 && h < 18;
                  return h >= 18 || h < 6;
                });
                return (
                  <div key={slot.label} className="card-list-row">
                    <div className={`icon-box ${slot.color}`}><slot.icon /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-sans font-medium text-foreground leading-tight">{slot.label}</p>
                      <p className="card-support">
                        {slot.time}
                        {slotEvents.length > 0 ? ` · ${slotEvents.length} compromisso${slotEvents.length > 1 ? "s" : ""}` : ` · ${slot.hint}`}
                      </p>
                    </div>
                  </div>
                );
              })}
              <p className="card-support pt-1">
                Seus compromissos do dia são distribuídos automaticamente por período.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Próximos compromissos ── */}
      <motion.div custom={7} initial="hidden" animate="visible" variants={cardVariant}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="card-section-title">
                <div className="icon-box icon-box-cyan"><Clock /></div>
                Próximos compromissos
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary h-8 font-sans" onClick={() => router.push("/agenda")}>
                Ver agenda <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUpcoming ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : upcomingEvents.length > 0 ? (
              <ul className="space-y-2">
                {upcomingEvents.map((ev) => {
                  const start = parseISO(ev.start_time);
                  const isEvToday = isTodayFn(start);
                  return (
                    <li key={ev.id} className="card-list-row">
                      <div className="icon-box icon-box-blue"><CalendarDays /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans font-medium text-foreground truncate">{ev.title}</p>
                        <p className="card-support">
                          {isEvToday ? "Hoje" : format(start, "EEE, dd/MM", { locale: ptBR })} · {ev.all_day ? "Dia inteiro" : format(start, "HH:mm")}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-sans">{ev.category}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="card-empty">
                <Clock className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-sans text-muted-foreground">Nenhum compromisso próximo.</p>
                <p className="card-support mt-1">Adicione compromissos na Agenda para vê-los aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Visão semanal ── */}
      <motion.div custom={8} initial="hidden" animate="visible" variants={cardVariant}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="card-section-title">
              <div className="icon-box icon-box-violet"><CalendarRange /></div>
              Visão semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {weekDates.map((d) => {
                const dayKey = format(d.date, "yyyy-MM-dd");
                const count = weekEventCounts.get(dayKey) || 0;
                return (
                  <div
                    key={d.label + d.day}
                    className={`flex flex-col items-center rounded-xl py-2.5 transition-all duration-200 ${
                      d.isToday
                        ? "shadow-md text-white"
                        : "bg-muted/40 text-foreground hover:bg-muted/60"
                    }`}
                    style={d.isToday ? { backgroundColor: "#243d4d" } : undefined}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-heading font-medium opacity-70">{d.label}</span>
                    <span className="text-lg font-heading font-bold leading-tight mt-0.5">{d.day}</span>
                    {count > 0 && (
                      <span className={`text-[9px] mt-0.5 font-sans font-semibold ${d.isToday ? "text-white/70" : "text-primary"}`}>
                        {count} ev.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {nextSermon ? (
              <div className="card-list-row">
                <div className="icon-box icon-box-rose"><Mic /></div>
                <div className="min-w-0">
                  <p className="text-sm font-sans font-medium text-foreground truncate">{nextSermon.title}</p>
                  <p className="card-support">
                    {format(parseISO(nextSermon.sermon_date!), "EEEE, dd/MM", { locale: ptBR })}
                    {nextSermon.church_name ? ` · ${nextSermon.church_name}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <p className="card-support text-center">
                Nenhuma pregação agendada para esta semana.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Assistente Pastoral ── */}
      <motion.div custom={9} initial="hidden" animate="visible" variants={cardVariant}>
        <Card
          className="overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ borderColor: "rgba(36,61,77,0.15)" }}
          role="button"
          tabIndex={0}
          onClick={() => router.push("/assistente")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/assistente"); } }}
        >
          <CardContent className="py-5 px-5 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="icon-box icon-box-indigo h-11 w-11">
                <Bot className="!h-5 !w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-sm font-semibold text-foreground">Assistente Pastoral</h3>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed mt-0.5">
                  Precisa de ajuda com um sermão, uma questão teológica ou organização ministerial?
                </p>
              </div>
              <div className="shrink-0 text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <WelcomeChecklist />
    </div>
  );
}
