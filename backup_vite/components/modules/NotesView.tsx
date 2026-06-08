import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2, Check, X } from "lucide-react";
import type { Note } from "@/hooks/useNotes";

interface Props {
  notes: Note[];
  isLoading: boolean;
  onCreate: (n: { title: string; content: string }) => Promise<unknown>;
  onUpdate: (n: { id: string; title?: string; content?: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function NotesView({ notes, isLoading, onCreate, onUpdate, onDelete }: Props) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    await onCreate({ title: newTitle.trim(), content: newContent.trim() });
    setNewTitle("");
    setNewContent("");
    setCreating(false);
  };

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onUpdate({ id: editingId, title: editTitle.trim(), content: editContent.trim() });
    setEditingId(null);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova anotação
        </Button>
      ) : (
        <Card>
          <CardContent className="py-4 space-y-3">
            <Input placeholder="Título (opcional)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea rows={3} placeholder="Escreva sua anotação…" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
              <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim() && !newContent.trim()}>
                <Check className="h-4 w-4 mr-1" />Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !creating && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <StickyNote className="h-10 w-10 text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Crie anotações rápidas para apoiar seu ministério.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((n) =>
          editingId === n.id ? (
            <Card key={n.id}>
              <CardContent className="py-3 space-y-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                  <Button size="sm" onClick={saveEdit}>Salvar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={n.id} className="cursor-pointer hover:bg-accent/30 transition-colors group" onClick={() => startEdit(n)}>
              <CardContent className="py-3">
                {n.title && <p className="text-sm font-semibold text-foreground leading-tight mb-1">{n.title}</p>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{n.content || "Anotação vazia"}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/60">
                    {format(new Date(n.updated_at), "d MMM, HH:mm", { locale: ptBR })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
