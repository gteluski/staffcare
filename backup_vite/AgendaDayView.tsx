import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/event-categories";
import type { AppEvent } from "@/hooks/useEvents";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

interface Props {
  currentDate: Date;
  events: AppEvent[];
  onEventClick: (event: AppEvent) => void;
  onSlotClick: (date: Date) => void;
}

export function AgendaDayView({ currentDate, events, onEventClick, onSlotClick }: Props) {
  const { allDayEvents, timedByHour } = useMemo(() => {
    const allDay: AppEvent[] = [];
    const timed: Record<number, AppEvent[]> = {};
    events.forEach((e) => {
      if ((e as any).isSystemEvent || e.all_day) {
        allDay.push(e);
      } else {
        const h = new Date(e.start_time).getHours();
        (timed[h] ??= []).push(e);
      }
    });
    return { allDayEvents: allDay, timedByHour: timed };
  }, [events]);

  return (
    <Card className="overflow-auto">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b p-2 space-y-1">
          {allDayEvents.map((evt) => {
            const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
            const CatIcon = cat.icon;
            return (
              <button
                key={evt.id}
                onClick={() => onEventClick(evt)}
                className={`flex items-center gap-1.5 w-full text-left text-xs rounded px-2 py-1.5 ${cat.bgClass} ${cat.textClass} border border-dashed border-current/20`}
              >
                <CatIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-medium">{evt.title}</span>
                <span className="text-[10px] ml-auto shrink-0 opacity-70">{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-[60px_1fr]">
        {HOURS.map((hour) => {
          const hourEvents = timedByHour[hour] || [];
          return (
            <div key={hour} className="contents">
              <div className="h-16 border-b flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-muted-foreground">{`${hour}:00`}</span>
              </div>
              <div
                className="h-16 border-b border-l cursor-pointer hover:bg-accent/20 transition-colors p-1 space-y-0.5"
                onClick={() => {
                  const dt = new Date(currentDate);
                  dt.setHours(hour, 0, 0, 0);
                  onSlotClick(dt);
                }}
              >
                {hourEvents.map((evt) => {
                  const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                      className={`flex items-center gap-1.5 w-full text-left text-xs rounded px-2 py-1 ${cat.bgClass} ${cat.textClass}`}
                    >
                      <CatIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">{evt.title}</span>
                      <span className="text-[10px] ml-auto shrink-0 opacity-70">
                        {format(new Date(evt.start_time), "HH:mm")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
