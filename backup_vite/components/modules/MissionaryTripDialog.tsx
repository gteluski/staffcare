import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MissionaryTrip } from "@/hooks/useMinistry";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MissionaryTrip | null;
  onSave: (data: Omit<MissionaryTrip, "id" | "user_id" | "created_at" | "updated_at">) => void;
  saving?: boolean;
}

export function MissionaryTripDialog({ open, onOpenChange, initial, onSave, saving }: Props) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [churchCommunity, setChurchCommunity] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setLocation(initial?.location ?? "");
      setStartDate(initial?.start_date ?? "");
      setEndDate(initial?.end_date ?? "");
      setChurchCommunity(initial?.church_community ?? "");
      setDescription(initial?.description ?? "");
      setResults(initial?.results ?? "");
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!title) return;
    onSave({
      title,
      location,
      start_date: startDate || null,
      end_date: endDate || null,
      church_community: churchCommunity,
      description,
      results,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{initial ? "Editar Viagem" : "Nova Viagem Missionária"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Título da Viagem *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Missão no Sertão Nordestino" />
          </div>
          <div className="space-y-1.5">
            <Label>Local / Cidade</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Recife, PE" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Término</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Igreja / Comunidade</Label>
            <Input value={churchCommunity} onChange={(e) => setChurchCommunity(e.target.value)} placeholder="Ex: Comunidade Nova Esperança" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a viagem..." />
          </div>
          <div className="space-y-1.5">
            <Label>Resultados e Percepções</Label>
            <Textarea rows={2} value={results} onChange={(e) => setResults(e.target.value)} placeholder="O que Deus fez nessa viagem?" />
          </div>
          <div className="space-y-1.5">
            <Label>Anotações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !title}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
