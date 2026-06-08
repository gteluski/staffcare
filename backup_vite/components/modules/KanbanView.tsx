import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Link2 } from "lucide-react";
import { TASK_CATEGORIES, PRIORITY_META } from "@/lib/task-categories";
import type { Task, TaskStatus } from "@/hooks/useTasks";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "a_fazer", label: "A Fazer", color: "border-t-amber-400" },
  { status: "em_andamento", label: "Em Andamento", color: "border-t-blue-400" },
  { status: "concluido", label: "Concluído", color: "border-t-emerald-400" },
];

interface Props {
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onNewInColumn: (status: TaskStatus) => void;
}

export function KanbanView({ tasks, onTaskClick, onNewInColumn }: Props) {
  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { a_fazer: [], em_andamento: [], concluido: [] };
    tasks.forEach((t) => (map[t.status] ??= []).push(t));
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <Card key={col.status} className={`border-t-4 ${col.color}`}>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              {col.label} <span className="text-muted-foreground font-normal ml-1">({grouped[col.status].length})</span>
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNewInColumn(col.status)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[120px]">
            {grouped[col.status].length === 0 && (
              <p className="text-xs text-muted-foreground/60 text-center py-6">Nenhuma tarefa aqui.</p>
            )}
            {grouped[col.status].map((t) => {
              const cat = TASK_CATEGORIES[t.category] || TASK_CATEGORIES.Outra;
              const pri = PRIORITY_META[t.priority];
              const CatIcon = cat.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => onTaskClick(t)}
                  className="w-full text-left rounded-lg border p-2.5 hover:bg-accent/30 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground leading-tight truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CatIcon className={`h-3 w-3 ${cat.textClass}`} />
                    <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                    {t.event_id && <Link2 className="h-3 w-3 text-primary ml-auto" />}
                    {!t.event_id && <span className={`h-1.5 w-1.5 rounded-full ml-auto ${pri.dotClass}`} />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
