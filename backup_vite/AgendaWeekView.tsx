import { useMemo } from "react";
import { startOfWeek, addDays, format, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/event-categories";
import type { AppEvent } from "@/hooks/useEvents";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6–21

interface Props {
  currentDate: Date;
  events: AppEvent[];
  onEventClick: (event: AppEvent) => void;
  onSlotClick: (date: Date) => void;
}

export function AgendaWeekView({ currentDate, events, onEventClick, onSlotClick }: Props) {
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Separate all-day/system events from timed events
  const { allDayByDay, timedByDay } = useMemo(() => {
    const allDay: Record<string, AppEvent[]> = {};
    const timed: Record<string, AppEvent[]> = {};
    events.forEach((e) => {
      const key = format(new Date(e.start_time), "yyyy-MM-dd");
      if ((e as any).isSystemEvent || e.all_day) {
        (allDay[key] ??= []).push(e);
      } else {
        (timed[key] ??= []).push(e);
      }
    });
    return { allDayByDay: allDay, timedByDay: timed };
  }, [events]);

  const hasAllDay = weekDays.some((d) => (allDayByDay[format(d, "yyyy-MM-dd")] || []).length > 0);

  return (
    <Card className="overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b bg-muted/50 sticky top-0 z-10">
        <div />
        {weekDays.map((d) => (
          <div key={d.toISOString()} className="py-2 text-center border-l">
            <span className="text-[10px] uppercase text-muted-foreground block">
              {format(d, "EEE", { locale: ptBR })}
            </span>
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              {format(d, "d")}
            </span>
          </div>
        ))}
      </div>

      {/* All-day row for system/holiday events */}
      {hasAllDay && (
        <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b">
          <div className="flex items-center justify-end pr-2">
            <span className="text-[9px] text-muted-foreground font-medium">Dia</span>
          </div>
          {weekDays.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const dayAllDay = allDayByDay[key] || [];
            return (
              <div key={`allday-${key}`} className="border-l p-0.5 min-h-[28px] space-y-0.5">
                {dayAllDay.map((evt) => {
                  const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick(evt)}
                      className={`w-full text-[9px] leading-tight truncate rounded px-1 py-0.5 ${cat.bgClass} ${cat.textClass} border border-dashed border-current/20`}
                    >
                      {evt.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)]">
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="h-14 border-b flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">{`${hour}:00`}</span>
            </div>
            {weekDays.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const dayEvents = (timedByDay[key] || []).filter((e) => {
                const h = new Date(e.start_time).getHours();
                return h === hour;
              });
              return (
                <div
                  key={`${key}-${hour}`}
                  className="h-14 border-b border-l cursor-pointer hover:bg-accent/20 transition-colors relative"
                  onClick={() => {
                    const dt = new Date(d);
                    dt.setHours(hour, 0, 0, 0);
                    onSlotClick(dt);
                  }}
                >
                  {dayEvents.map((evt) => {
                    const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                    return (
                      <button
                        key={evt.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                        className={`absolute inset-x-0.5 top-0.5 text-[10px] leading-tight truncate rounded px-1 py-0.5 ${cat.bgClass} ${cat.textClass} z-10`}
                      >
                        {evt.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
