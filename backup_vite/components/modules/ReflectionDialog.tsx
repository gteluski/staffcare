import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentReflection: string;
  onSave: (reflection: string) => void;
  saving?: boolean;
}

export function ReflectionDialog({ open, onOpenChange, currentReflection, onSave, saving }: Props) {
  const [text, setText] = useState(currentReflection);

  useEffect(() => {
    if (open) setText(currentReflection);
  }, [open, currentReflection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Reflexão e Revisão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground italic">
            "Examine-se a si mesmo" — reserve um momento para avaliar como foi este período. O que Deus ensinou? O que pode melhorar?
          </p>
          <div className="space-y-1.5">
            <Label>Sua Reflexão</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Como foi este período? O que funcionou bem? O que precisa de ajuste? O que Deus mostrou?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(text)} disabled={saving}>{saving ? "Salvando..." : "Salvar Reflexão"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
