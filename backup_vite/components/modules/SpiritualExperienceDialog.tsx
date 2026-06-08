import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SpiritualExperience } from "@/hooks/useMinistry";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SpiritualExperience | null;
  onSave: (data: Omit<SpiritualExperience, "id" | "user_id" | "created_at" | "updated_at">) => void;
  saving?: boolean;
}

export function SpiritualExperienceDialog({ open, onOpenChange, initial, onSave, saving }: Props) {
  const [title, setTitle] = useState("");
  const [expDate, setExpDate] = useState("");
  const [expText, setExpText] = useState("");
  const [words, setWords] = useState("");
  const [prayer, setPrayer] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setExpDate(initial?.experience_date ?? "");
      setExpText(initial?.experience_text ?? "");
      setWords(initial?.words_from_god ?? "");
      setPrayer(initial?.prayer_notes ?? "");
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!title) return;
    onSave({
      title,
      experience_date: expDate || null,
      experience_text: expText,
      words_from_god: words,
      prayer_notes: prayer,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{initial ? "Editar Experiência" : "Nova Experiência com Deus"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Confirmação do chamado" />
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Experiência / Reflexão</Label>
            <Textarea rows={4} value={expText} onChange={(e) => setExpText(e.target.value)} placeholder="Descreva o que aconteceu e como Deus se manifestou..." />
          </div>
          <div className="space-y-1.5">
            <Label>Palavras que Deus tem dado</Label>
            <Textarea rows={3} value={words} onChange={(e) => setWords(e.target.value)} placeholder="Versículos, impressões, direções espirituais..." />
          </div>
          <div className="space-y-1.5">
            <Label>Notas de Oração e Ação</Label>
            <Textarea rows={2} value={prayer} onChange={(e) => setPrayer(e.target.value)} placeholder="Pedidos, decisões, próximos passos..." />
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
