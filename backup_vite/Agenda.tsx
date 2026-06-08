import { useState, useMemo, useCallback } from "react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, MapPin,
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { AgendaDayView } from "@/components/agenda/AgendaDayView";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { EventDialog } from "@/components/agenda/EventDialog";
import { SystemEventDetail } from "@/components/agenda/SystemEventDetail";
import { getSystemCalendarEvents, getYearsInRange } from "@/lib/system-calendar";
import { CATEGORIES } from "@/lib/event-categories";
import type { AppEvent } from "@/hooks/useEvents";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

type ViewMode = "month" | "week" | "day" | "list";

export default function Agenda() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [systemDetailEvent, setSystemDetailEvent] = useState<AppEvent | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);

  // Range for data fetching — always cover at least the current month view + buffer
  const rangeStart = useMemo(() => {
    if (view === "month") return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    if (view === "week") return startOfWeek(currentDate, { weekStartsOn: 0 });
    if (view === "day") return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    return startOfMonth(currentDate);
  }, [view, currentDate]);

  const rangeEnd = useMemo(() => {
    if (view === "month") return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    if (view === "week") return endOfWeek(currentDate, { weekStartsOn: 0 });
    if (view === "day") return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
    return endOfMonth(currentDate);
  }, [view, currentDate]);

  const { data: userEvents = [], isLoading, createEvent, updateEvent, deleteEvent } = useEvents(rangeStart, rangeEnd);

  const allEvents = useMemo(() => {
    const years = getYearsInRange(rangeStart, rangeEnd);
    const systemEvents = getSystemCalendarEvents(years);
    const rangeStartTime = rangeStart.getTime();
    const rangeEndTime = rangeEnd.getTime();
    const filtered = systemEvents.filter((e) => {
      const t = new Date(e.start_time).getTime();
      return t >= rangeStartTime && t <= rangeEndTime;
    });
    return [...userEvents, ...(filtered as any)] as AppEvent[];
  }, [userEvents, rangeStart, rangeEnd]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Events indexed by date key
  const eventsByDay = useMemo(() => {
    const map: Record<string, AppEvent[]> = {};
    allEvents.forEach((e) => {
      const key = format(new Date(e.start_time), "yyyy-MM-dd");
      (map[key] ??= []).push(e);
    });
    return map;
  }, [allEvents]);

  // Events for the selected day
  const selectedDayKey = format(selectedDay, "yyyy-MM-dd");
  const selectedDayEvents = eventsByDay[selectedDayKey] || [];
  const systemEventsForDay = selectedDayEvents.filter((e) => (e as any).isSystemEvent);
  const userEventsForDay = selectedDayEvents.filter((e) => !(e as any).isSystemEvent);
  const orderedDayEvents = [...systemEventsForDay, ...userEventsForDay];

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const title = (() => {
    if (view === "day") return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, "d MMM", { locale: ptBR })} – ${format(we, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  })();

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDay(date);
    if (view !== "month") {
      setPrefillDate(date);
      setEditingEvent(null);
      setDialogOpen(true);
    }
  }, [view]);

  const handleCalendarDayClick = useCallback((date: Date) => {
    setSelectedDay(date);
    if (!isSameMonth(date, currentDate)) {
      setCurrentDate(date);
    }
  }, [currentDate]);

  const handleEventClick = useCallback((event: AppEvent) => {
    if ((event as any).isSystemEvent) {
      setSystemDetailEvent(event);
      return;
    }
    setEditingEvent(event);
    setPrefillDate(null);
    setDialogOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditingEvent(null);
    setPrefillDate(selectedDay);
    setDialogOpen(true);
  }, [selectedDay]);

  const handleNewFromDay = useCallback(() => {
    setEditingEvent(null);
    setPrefillDate(selectedDay);
    setDialogOpen(true);
  }, [selectedDay]);

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h1 className="font-heading text-lg sm:text-xl font-bold capitalize ml-1 truncate">{title}</h1>
          </div>
          <Button size="sm" className="h-8 text-xs shrink-0" onClick={handleNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Novo</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}>
            Hoje
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2 sm:px-2.5 h-7">Mês</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2 sm:px-2.5 h-7">Semana</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2 sm:px-2.5 h-7">Dia</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2 sm:px-2.5 h-7">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Month view: split layout */}
      {view === "month" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Calendar grid */}
          <Card className="card-premium overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="py-2.5 text-center">
                  <span className="text-[11px] font-heading font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDay[key] || [];
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                const selected = isSameDay(day, selectedDay);
                const hasEvents = dayEvents.length > 0;
                const hasSystem = dayEvents.some((e) => (e as any).isSystemEvent);
                const hasUser = dayEvents.some((e) => !(e as any).isSystemEvent);

                return (
                  <button
                    key={key}
                    onClick={() => handleCalendarDayClick(day)}
                    className={`
                      relative min-h-[72px] sm:min-h-[88px] border-b border-r border-border/30 p-1.5
                      transition-all duration-150 text-left group
                      ${!inMonth ? "bg-muted/20" : "hover:bg-accent/30"}
                      ${selected ? "bg-primary/5 ring-1 ring-primary/30 ring-inset" : ""}
                    `}
                  >
                    {/* Day number */}
                    <span
                      className={`
                        inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-heading font-semibold
                        transition-colors
                        ${today && selected ? "bg-primary text-primary-foreground" : ""}
                        ${today && !selected ? "bg-primary text-primary-foreground" : ""}
                        ${!today && selected ? "bg-primary/15 text-primary font-bold" : ""}
                        ${!today && !selected && inMonth ? "text-foreground" : ""}
                        ${!inMonth ? "text-muted-foreground/40" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Event dots */}
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-0.5 px-0.5">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                          return (
                            <span
                              key={evt.id}
                              className={`w-full h-1 rounded-full ${cat.bgClass} opacity-80`}
                              style={{ maxWidth: "100%" }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Event previews (desktop only) */}
                    <div className="hidden sm:block mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                        const isSystem = (evt as any).isSystemEvent;
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(evt); }}
                            className={`
                              text-[10px] leading-tight truncate rounded px-1 py-0.5 cursor-pointer
                              ${cat.bgClass} ${cat.textClass}
                              ${isSystem ? "border border-dashed border-current/20" : ""}
                            `}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-muted-foreground pl-1">
                          +{dayEvents.length - 2} mais
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right side: Day detail panel */}
          <div className="space-y-3">
            <Card className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-heading font-medium text-muted-foreground uppercase tracking-wider">
                    Compromissos do dia
                  </p>
                  <h3 className="text-base font-heading font-bold capitalize mt-0.5">
                    {format(selectedDay, "EEEE", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading text-lg font-bold">
                    {format(selectedDay, "d")}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleNewFromDay}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar compromisso
              </Button>
            </Card>

            {/* Events list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDayKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                {orderedDayEvents.length === 0 ? (
                  <Card className="card-premium p-6 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum compromisso neste dia
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Você pode adicionar um novo compromisso
                    </p>
                  </Card>
                ) : (
                  orderedDayEvents.map((evt, i) => {
                    const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                    const CatIcon = cat.icon;
                    const isSystem = (evt as any).isSystemEvent;

                    return (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Card
                          className={`
                            card-premium p-3 cursor-pointer transition-all duration-150
                            hover:shadow-md hover:-translate-y-0.5 group
                            ${isSystem ? "border-l-2" : "border-l-2"}
                          `}
                          style={{ borderLeftColor: `hsl(${cat.color})` }}
                          onClick={() => handleEventClick(evt)}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cat.bgClass}`}>
                              <CatIcon className={`h-3.5 w-3.5 ${cat.textClass}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-heading font-semibold text-foreground truncate">
                                {evt.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isSystem || evt.all_day ? (
                                  <span className="text-[11px] text-muted-foreground">Dia inteiro</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(evt.start_time), "HH:mm")} – {format(new Date(evt.end_time), "HH:mm")}
                                  </span>
                                )}
                                {evt.location && (
                                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                    <MapPin className="h-3 w-3" />
                                    {evt.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] shrink-0 ${cat.textClass} border-current/20 font-heading`}
                            >
                              {cat.label}
                            </Badge>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Other views */}
      {view === "week" && (
        <AgendaWeekView
          currentDate={currentDate}
          events={allEvents}
          onEventClick={handleEventClick}
          onSlotClick={handleDayClick}
        />
      )}
      {view === "day" && (
        <AgendaDayView
          currentDate={currentDate}
          events={allEvents}
          onEventClick={handleEventClick}
          onSlotClick={handleDayClick}
        />
      )}
      {view === "list" && (
        <AgendaListView
          events={allEvents}
          isLoading={isLoading}
          onEventClick={handleEventClick}
        />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        prefillDate={prefillDate}
        onCreate={(e) => createEvent.mutateAsync(e).then(() => setDialogOpen(false))}
        onUpdate={(e) => updateEvent.mutateAsync(e).then(() => setDialogOpen(false))}
        onDelete={(id) => deleteEvent.mutateAsync(id).then(() => setDialogOpen(false))}
      />

      <SystemEventDetail
        event={systemDetailEvent}
        open={!!systemDetailEvent}
        onOpenChange={(open) => { if (!open) setSystemDetailEvent(null); }}
      />
    </div>
  );
}
