import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/event-categories";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { AppEvent } from "@/hooks/useEvents";

interface Props {
  events: AppEvent[];
  isLoading: boolean;
  onEventClick: (event: AppEvent) => void;
}

export function AgendaListView({ events, isLoading, onEventClick }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Carregando…
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum compromisso neste período.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Clique em "Novo" para adicionar seu primeiro evento.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const grouped: Record<string, AppEvent[]> = {};
  events.forEach((e) => {
    const key = format(new Date(e.start_time), "yyyy-MM-dd");
    (grouped[key] ??= []).push(e);
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => (
        <Card key={dateKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold capitalize">
              {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {dayEvents.map((evt) => {
              const cat = CATEGORIES[evt.category] || CATEGORIES.Outro;
              const CatIcon = cat.icon;
              const isSystem = (evt as any).isSystemEvent;
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/40 ${cat.bgClass} ${
                    isSystem ? "border border-dashed border-current/20" : ""
                  }`}
                >
                  <CatIcon className={`h-4 w-4 shrink-0 ${cat.textClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      {isSystem ? (
                        <span>Dia inteiro</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(evt.start_time), "HH:mm")} – {format(new Date(evt.end_time), "HH:mm")}
                        </span>
                      )}
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${cat.textClass} border-current/30`}>
                    {cat.label}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
