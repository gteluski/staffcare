import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Save, Printer, Download, Presentation, FileText, Trash2,
  ChevronLeft, Check, Loader2, BookOpen, GraduationCap, StickyNote, File, Tag,
  ArrowLeft, X, FileDown, Clock, MoreHorizontal,
} from "lucide-react";
import { useDocuments, type Document, type DocType } from "@/hooks/useDocuments";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { exportToDocx, exportToPdf } from "@/lib/document-export";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

const DOC_TYPES: { value: DocType; label: string; icon: LucideIcon }[] = [
  { value: "Sermão", label: "Sermão", icon: BookOpen },
  { value: "Estudo", label: "Estudo", icon: GraduationCap },
  { value: "Nota", label: "Nota", icon: StickyNote },
  { value: "Documento", label: "Documento", icon: File },
  { value: "Outro", label: "Outro", icon: Tag },
];

export default function Editor() {
  const { data: docs = [], isLoading, createDocument, updateDocument, deleteDocument } = useDocuments();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState<DocType>("Outro");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<DocType>("Sermão");
  const [preachingMode, setPreachingMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const openDoc = useCallback((doc: Document) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setDocType(doc.doc_type);
    setSaveStatus("saved");
  }, []);

  useEffect(() => {
    if (!activeDocId || saveStatus !== "unsaved") return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateDocument.mutateAsync({ id: activeDocId, title, content, doc_type: docType });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [title, content, docType, activeDocId, saveStatus]);

  const markUnsaved = () => setSaveStatus("unsaved");

  const handleSaveNow = async () => {
    if (!activeDocId) return;
    clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    try {
      await updateDocument.mutateAsync({ id: activeDocId, title, content, doc_type: docType });
      setSaveStatus("saved");
      toast.success("Documento salvo.");
    } catch {
      setSaveStatus("unsaved");
      toast.error("Erro ao salvar.");
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const doc = await createDocument.mutateAsync({ title: newTitle.trim(), doc_type: newType });
    setNewDialogOpen(false);
    setNewTitle("");
    openDoc(doc as Document);
  };

  const handleDelete = async () => {
    if (!activeDocId) return;
    await deleteDocument.mutateAsync(activeDocId);
    setActiveDocId(null);
    setDeleteConfirmOpen(false);
    toast.success("Documento excluído.");
  };

  const handlePrint = () => exportToPdf(title, content);
  const handleDownloadTxt = () => {
    const div = document.createElement("div");
    div.innerHTML = content;
    const plainText = div.textContent || div.innerText || "";
    const blob = new Blob([`${title}\n\n${plainText}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleDownloadDocx = async () => {
    try {
      await exportToDocx(title, content);
      toast.success("Documento DOCX gerado com sucesso.");
    } catch { toast.error("Erro ao gerar DOCX."); }
  };
  const handleDownloadPdf = () => exportToPdf(title, content);

  // ── Preaching mode ──
  if (preachingMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-card shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setPreachingMode(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Presentation className="h-3.5 w-3.5" /> Modo Pregação
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreachingMode(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight text-center mb-6 sm:mb-8">{title}</h1>
            <div className="prose prose-lg sm:prose-xl max-w-none font-heading text-foreground leading-[2] prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground" dangerouslySetInnerHTML={{ __html: content }} />
            {(!content || content === "<p></p>") && (
              <div className="text-center py-16">
                <Presentation className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">Este documento ainda não tem conteúdo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Document list ──
  if (!activeDocId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Editor</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Seus sermões, estudos e documentos</p>
          </div>
          <Button size="sm" onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo documento
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>}

        {!isLoading && docs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum documento criado ainda</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Crie seu primeiro sermão, estudo bíblico ou anotação pastoral usando nosso editor completo.
              </p>
              <Button size="sm" className="mt-5" onClick={() => setNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Criar documento
              </Button>
            </CardContent>
          </Card>
        )}

        {docs.length > 0 && (
          <div className="grid gap-2">
            {docs.map((doc) => {
              const typeInfo = DOC_TYPES.find((t) => t.value === doc.doc_type) || DOC_TYPES[4];
              const Icon = typeInfo.icon;
              const div = globalThis.document?.createElement("div");
              if (div) div.innerHTML = doc.content;
              const plainText = div?.textContent || "";
              const wordCount = plainText.split(/\s+/).filter(Boolean).length;
              return (
                <div key={doc.id} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group" onClick={() => openDoc(doc)}>
                  <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-foreground">{doc.title || "Sem título"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {typeInfo.label} · {wordCount > 0 ? `${wordCount} palavras · ` : ""}
                      {format(new Date(doc.updated_at), "d MMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Novo documento</DialogTitle>
              <DialogDescription className="text-xs">Escolha um título e tipo para começar a escrever.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Título do documento" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
              <Select value={newType} onValueChange={(v) => setNewType(v as DocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => {
                    const I = t.icon;
                    return <SelectItem key={t.value} value={t.value}><span className="flex items-center gap-2"><I className="h-3.5 w-3.5" />{t.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Writing view ──
  return (
    <div className="editor-page">
      {/* ═══ Top Action Bar ═══ */}
      <div className="editor-action-bar">
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink overflow-hidden">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg shrink-0" onClick={() => setActiveDocId(null)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={docType} onValueChange={(v) => { setDocType(v as DocType); markUnsaved(); }}>
            <SelectTrigger className="h-8 w-[100px] sm:w-[130px] text-xs border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((t) => {
                const I = t.icon;
                return <SelectItem key={t.value} value={t.value}><span className="flex items-center gap-2"><I className="h-3.5 w-3.5" />{t.label}</span></SelectItem>;
              })}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1 shrink-0">
            {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> <span className="hidden sm:inline">Salvando…</span></>}
            {saveStatus === "saved" && <><Check className="h-3 w-3 text-emerald-600" /> <span className="hidden sm:inline">Salvo</span></>}
            {saveStatus === "unsaved" && <><Clock className="h-3 w-3" /> <span className="hidden sm:inline">Não salvo</span></>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveNow} disabled={saveStatus === "saved"}>
            <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Salvar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-2" /> Imprimir</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTxt}><Download className="h-3.5 w-3.5 mr-2" /> Texto (.txt)</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPdf}><FileText className="h-3.5 w-3.5 mr-2" /> PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDocx}><File className="h-3.5 w-3.5 mr-2" /> Word (.docx)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPreachingMode(true)}><Presentation className="h-3.5 w-3.5 mr-2" /> Modo Pregação</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
                  <FileDown className="h-3.5 w-3.5" /> Baixar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTxt}><Download className="h-3.5 w-3.5 mr-2" /> Texto (.txt)</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf}><FileText className="h-3.5 w-3.5 mr-2" /> PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadDocx}><File className="h-3.5 w-3.5 mr-2" /> Word (.docx)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setPreachingMode(true)}>
              <Presentation className="h-3.5 w-3.5" /> Pregação
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento <strong>"{title}"</strong> será removido permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Document Shell (desk surface) ═══ */}
      <div className="editor-document-shell">
        {/* ── Title ── */}
        <div className="editor-title-area">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markUnsaved(); }}
            placeholder="Título do documento"
            className="editor-title-input"
            spellCheck
            lang="pt-BR"
          />
        </div>

        {/* ── Editor Component ── */}
        <RichTextEditor
          content={content}
          onChange={(html) => { setContent(html); markUnsaved(); }}
          placeholder="Comece a escrever seu documento…"
        />
      </div>
    </div>
  );
}
