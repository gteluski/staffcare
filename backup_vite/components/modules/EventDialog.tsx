import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { CATEGORIES, CATEGORY_LIST, type EventCategory } from "@/lib/event-categories";
import type { AppEvent, EventInsert } from "@/hooks/useEvents";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AppEvent | null;
  prefillDate: Date | null;
  onCreate: (e: EventInsert) => Promise<void>;
  onUpdate: (e: Partial<AppEvent> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EventDialog({ open, onOpenChange, event, prefillDate, onCreate, onUpdate, onDelete }: Props) {
  const isEditing = !!event;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EventCategory>("Outro");
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setLocation(event.location || "");
      setCategory(event.category);
      setAllDay(event.all_day);
      const s = new Date(event.start_time);
      const e = new Date(event.end_time);
      setStartDate(format(s, "yyyy-MM-dd"));
      setStartTime(format(s, "HH:mm"));
      setEndDate(format(e, "yyyy-MM-dd"));
      setEndTime(format(e, "HH:mm"));
    } else {
      const d = prefillDate || new Date();
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("Outro");
      setAllDay(false);
      setStartDate(format(d, "yyyy-MM-dd"));
      setStartTime(format(d, "HH:mm"));
      setEndDate(format(d, "yyyy-MM-dd"));
      setEndTime(format(new Date(d.getTime() + 3600000), "HH:mm"));
    }
  }, [open, event, prefillDate]);

  const handleSubmit = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    setSaving(true);
    try {
      const startISO = new Date(`${startDate}T${allDay ? "00:00" : startTime}`).toISOString();
      const endISO = new Date(`${endDate}T${allDay ? "23:59" : endTime}`).toISOString();
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        category,
        all_day: allDay,
        start_time: startISO,
        end_time: endISO,
        calendar_context: "principal" as const,
      };
      if (isEditing) {
        await onUpdate({ id: event.id, ...payload });
      } else {
        await onCreate(payload);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await onDelete(event.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? "Editar compromisso" : "Novo compromisso"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing ? "Altere os campos desejados e salve." : "Preencha os dados do compromisso."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="evt-title">Título</Label>
            <Input id="evt-title" placeholder="Ex: Culto dominical" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="evt-category">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
              <SelectTrigger id="evt-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_LIST.map((c) => {
                  const meta = CATEGORIES[c];
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${meta.textClass}`} />
                        {meta.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="evt-allday" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="evt-allday" className="text-sm">Dia inteiro</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {!allDay && (
              <div>
                <Label>Hora início</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Data fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {!allDay && (
              <div>
                <Label>Hora fim</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="evt-location">Local (opcional)</Label>
            <Input id="evt-location" placeholder="Ex: Templo Central" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="evt-desc">Observações (opcional)</Label>
            <Textarea id="evt-desc" rows={2} placeholder="Anotações sobre este compromisso…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? "Salvando…" : isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
