import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/event-categories";
import type { AppEvent } from "@/hooks/useEvents";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Props {
  currentDate: Date;
  events: AppEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: AppEvent) => void;
}

export function AgendaMonthView({ currentDate, events, onDayClick, onEventClick }: Props) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, AppEvent[]> = {};
    events.forEach((e) => {
      const key = format(new Date(e.start_time), "yyyy-MM-dd");
      (map[key] ??= []).push(e);
    });
    return map;
  }, [events]);

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          // Separate system vs user events, system first
          const systemEvents = dayEvents.filter((e) => (e as any).isSystemEvent);
          const userEvents = dayEvents.filter((e) => !(e as any).isSystemEvent);
          const orderedEvents = [...systemEvents, ...userEvents];

          return (
            <div
              key={key}
              className={`min-h-[80px] sm:min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-accent/30 ${
                !inMonth ? "bg-muted/30" : ""
              }`}
              onClick={() => onDayClick(day)}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  today
                    ? "bg-primary text-primary-foreground"
                    : inMonth
                    ? "text-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {orderedEvents.slice(0, 3).map((evt) => {
                  const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                  const isSystem = (evt as any).isSystemEvent;
                  return (
                    <button
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                      className={`w-full text-left text-[10px] sm:text-xs leading-tight truncate rounded px-1 py-0.5 ${cat.bgClass} ${cat.textClass} ${
                        isSystem ? "border border-dashed border-current/20 font-medium" : ""
                      }`}
                      title={`${evt.title}${isSystem ? ` — ${cat.label}` : ""}`}
                    >
                      {evt.title}
                    </button>
                  );
                })}
                {orderedEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{orderedEvents.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
