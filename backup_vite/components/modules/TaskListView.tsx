import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TASK_CATEGORIES, PRIORITY_META } from "@/lib/task-categories";
import { CalendarDays, CheckSquare, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Task } from "@/hooks/useTasks";

interface Props {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (t: Task) => void;
  onToggleComplete: (t: Task) => void;
}

export function TaskListView({ tasks, isLoading, onTaskClick, onToggleComplete }: Props) {
  const { session } = useAuth();

  // Fetch linked events for tasks that have event_id
  const eventIds = [...new Set(tasks.filter((t) => t.event_id).map((t) => t.event_id!))];
  const { data: linkedEvents = [] } = useQuery({
    queryKey: ["task-linked-events", eventIds],
    enabled: eventIds.length > 0 && !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_time")
        .in("id", eventIds);
      return data ?? [];
    },
  });
  const eventsMap = new Map(linkedEvents.map((e) => [e.id, e]));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>;
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Clique em "Nova tarefa" para começar a organizar seu ministério.</p>
        </CardContent>
      </Card>
    );
  }

  const pending = tasks.filter((t) => t.status !== "concluido");
  const done = tasks.filter((t) => t.status === "concluido");

  return (
    <div className="space-y-2">
      {pending.map((t) => <TaskRow key={t.id} task={t} linkedEvent={eventsMap.get(t.event_id!)} onClick={onTaskClick} onToggle={onToggleComplete} />)}
      {done.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground pt-4 pb-1 font-medium">Concluídas ({done.length})</p>
          {done.map((t) => <TaskRow key={t.id} task={t} linkedEvent={eventsMap.get(t.event_id!)} onClick={onTaskClick} onToggle={onToggleComplete} />)}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, linkedEvent, onClick, onToggle }: { task: Task; linkedEvent?: { id: string; title: string; start_time: string }; onClick: (t: Task) => void; onToggle: (t: Task) => void }) {
  const cat = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.Outra;
  const pri = PRIORITY_META[task.priority];
  const isDone = task.status === "concluido";
  const CatIcon = cat.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent/30 ${isDone ? "opacity-60" : ""}`}
      onClick={() => onClick(task)}
    >
      <Checkbox
        checked={isDone}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => onToggle(task)}
        className="shrink-0"
      />
      <CatIcon className={`h-4 w-4 shrink-0 ${cat.textClass}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-tight truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`h-1.5 w-1.5 rounded-full ${pri.dotClass}`} />
          <span className="text-[11px] text-muted-foreground">{pri.label}</span>
          {task.due_date && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
            </span>
          )}
          {linkedEvent && (
            <span className="text-[11px] text-primary flex items-center gap-0.5">
              <Link2 className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{linkedEvent.title}</span>
            </span>
          )}
        </div>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bgClass} ${cat.textClass} shrink-0 hidden sm:block`}>
        {cat.label}
      </span>
    </div>
  );
}
