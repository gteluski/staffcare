import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/event-categories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Info } from "lucide-react";
import type { AppEvent } from "@/hooks/useEvents";

interface Props {
  event: AppEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemEventDetail({ event, open, onOpenChange }: Props) {
  if (!event) return null;

  const cat = CATEGORIES[event.category] || CATEGORIES.Outro;
  const CatIcon = cat.icon;
  const date = new Date(event.start_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cat.bgClass}`}>
              <CatIcon className={`h-4 w-4 ${cat.textClass}`} />
            </div>
            <Badge variant="outline" className={`text-[10px] ${cat.textClass} border-current/30`}>
              {cat.label}
            </Badge>
          </div>
          <DialogTitle className="font-heading text-lg">{event.title}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes do evento do calendário</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium text-foreground">Data:</span>
            <span className="capitalize">
              {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <div className={`rounded-lg p-3 ${cat.bgClass} border border-current/10 ${cat.textClass}`}>
              <p className="text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* System badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
            <Info className="h-3.5 w-3.5" />
            <span>
              Evento automático do calendário compartilhado — visível para todos os usuários.
              Este evento não pode ser editado.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
