import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, CalendarDays, X } from "lucide-react";
import { TASK_CATEGORIES, TASK_CATEGORY_LIST, PRIORITY_META, PRIORITY_LIST } from "@/lib/task-categories";
import type { Task, TaskInsert, TaskCategory, TaskPriority, TaskStatus } from "@/hooks/useTasks";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  defaultStatus?: TaskStatus;
  onCreate: (t: TaskInsert) => Promise<unknown>;
  onUpdate: (t: Partial<Task> & { id: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function TaskDialog({ open, onOpenChange, task, defaultStatus, onCreate, onUpdate, onDelete }: Props) {
  const { session } = useAuth();
  const isEditing = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Outra");
  const [priority, setPriority] = useState<TaskPriority>("média");
  const [status, setStatus] = useState<TaskStatus>("a_fazer");
  const [dueDate, setDueDate] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch user events for the selector
  const { data: events = [] } = useQuery({
    queryKey: ["events-for-tasks", session?.user?.id],
    enabled: !!session && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_time, all_day")
        .eq("user_id", session!.user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(50);
      return data ?? [];
    },
  });

  // Also include the currently linked event if it's in the past
  const { data: linkedEvent } = useQuery({
    queryKey: ["linked-event", task?.event_id],
    enabled: !!task?.event_id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_time, all_day")
        .eq("id", task!.event_id!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setCategory(task.category);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.due_date || "");
      setEventId(task.event_id);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Outra");
      setPriority("média");
      setStatus(defaultStatus || "a_fazer");
      setDueDate("");
      setEventId(null);
    }
  }, [open, task, defaultStatus]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status,
        due_date: dueDate || null,
        event_id: eventId || null,
      };
      if (isEditing) {
        await onUpdate({ id: task.id, ...payload });
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const STATUS_LABELS: Record<TaskStatus, string> = {
    a_fazer: "A Fazer",
    em_andamento: "Em Andamento",
    concluido: "Concluído",
  };

  // Build event options: merge future events + the current linked event if it's past
  const eventOptions = [...events];
  if (linkedEvent && !eventOptions.find((e) => e.id === linkedEvent.id)) {
    eventOptions.unshift(linkedEvent);
  }

  const selectedEventLabel = eventOptions.find((e) => e.id === eventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing ? "Altere os campos e salve." : "Preencha os dados da tarefa."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input placeholder="Ex: Preparar estudo bíblico" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORY_LIST.map((c) => {
                    const m = TASK_CATEGORIES[c];
                    const Icon = m.icon;
                    return (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-2"><Icon className={`h-3.5 w-3.5 ${m.textClass}`} />{m.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_LIST.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dotClass}`} />
                        {PRIORITY_META[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo (opcional)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Event linking */}
          <div>
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Vincular a compromisso (opcional)
            </Label>
            {eventId && selectedEventLabel ? (
              <div className="flex items-center gap-2 mt-1.5 rounded-lg border bg-accent/30 px-3 py-2">
                <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{selectedEventLabel.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(parseISO(selectedEventLabel.start_time), "EEE, dd/MM · HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEventId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Select value={eventId || "__none__"} onValueChange={(v) => setEventId(v === "__none__" ? null : v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Nenhum compromisso vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {eventOptions.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-3 w-3 text-primary" />
                        <span className="truncate">{ev.title}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {format(parseISO(ev.start_time), "dd/MM", { locale: ptBR })}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea rows={2} placeholder="Observações…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && (
            <Button variant="destructive" size="sm" className="mr-auto" disabled={saving} onClick={async () => {
              setSaving(true);
              await onDelete(task.id);
              onOpenChange(false);
              setSaving(false);
            }}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? "Salvando…" : isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
