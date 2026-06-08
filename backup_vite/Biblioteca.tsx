import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight, FolderPlus, Upload, ArrowLeft, Download, Trash2, Eye,
  FileText, FileSpreadsheet, File, Image as ImageIcon, BookOpen,
  MoreVertical, Pencil, RefreshCw, HardDrive,
} from "lucide-react";
import { useLibrary, type LibraryFolder, type LibraryFile } from "@/hooks/useLibrary";
import { DEFAULT_SECTIONS, type SectionMeta } from "@/lib/library-sections";
import { useAuth } from "@/hooks/useAuth";
import { UploadPanel, useUploadPanel } from "@/components/biblioteca/UploadPanel";
import { motion } from "framer-motion";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return FileSpreadsheet;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function canPreview(mime: string) {
  return mime.startsWith("image/") || mime.includes("pdf");
}

export default function Biblioteca() {
  const { session } = useAuth();
  const [folderStack, setFolderStack] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Biblioteca" },
  ]);
  const currentFolderId = folderStack[folderStack.length - 1].id;

  const {
    folders, files, isLoading,
    storageUsedBytes, storageQuotaMb,
    createFolder, uploadFile, deleteFolder, deleteFile, getDownloadUrl,
    renameFile, replaceFile,
  } = useLibrary(currentFolderId);

  const upload = useUploadPanel();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<LibraryFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [replaceTarget, setReplaceTarget] = useState<LibraryFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const quotaBytes = storageQuotaMb * 1024 * 1024;
  const usagePercent = quotaBytes > 0 ? Math.min((storageUsedBytes / quotaBytes) * 100, 100) : 0;
  const isQuotaFull = storageUsedBytes >= quotaBytes;

  const navigateInto = (folder: LibraryFolder) => {
    setFolderStack((s) => [...s, { id: folder.id, name: folder.name }]);
  };
  const navigateBack = () => {
    if (folderStack.length > 1) setFolderStack((s) => s.slice(0, -1));
  };
  const navigateTo = (index: number) => {
    setFolderStack((s) => s.slice(0, index + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync(newFolderName.trim());
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      const id = crypto.randomUUID();
      upload.addItem(id, file.name, file.type || "application/octet-stream");
      // Use -1 to signal indeterminate progress (real upload has no granular progress)
      upload.updateProgress(id, -1);

      try {
        await uploadFile.mutateAsync(file);
        upload.setSuccess(id);
      } catch (err: any) {
        const errorMsg = err?.message === "QUOTA_EXCEEDED"
          ? "Espaço insuficiente"
          : "Falha no envio";
        upload.setError(id, errorMsg);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [upload, uploadFile]);

  const handleDownload = async (f: LibraryFile) => {
    try {
      const url = await getDownloadUrl(f.file_path);
      window.open(url, "_blank");
    } catch {
      upload.addItem(f.id, f.name, f.mime_type);
      upload.setError(f.id, "Erro ao gerar link de download");
    }
  };

  const handlePreview = async (f: LibraryFile) => {
    setPreviewFile(f);
    try {
      const url = await getDownloadUrl(f.file_path);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameFile.mutateAsync({ id: renameTarget.id, name: renameValue.trim() });
      setRenameTarget(null);
    } catch {}
  };

  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTarget) return;
    const id = crypto.randomUUID();
    upload.addItem(id, file.name, file.type || "application/octet-stream");
    try {
      await replaceFile.mutateAsync({ existing: replaceTarget, newFile: file });
      upload.setSuccess(id);
    } catch (err: any) {
      const errorMsg = err?.message === "QUOTA_EXCEEDED" ? "Espaço insuficiente" : "Falha ao substituir";
      upload.setError(id, errorMsg);
    }
    setReplaceTarget(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const openRename = (f: LibraryFile) => { setRenameTarget(f); setRenameValue(f.name); };
  const openReplace = (f: LibraryFile) => { setReplaceTarget(f); setTimeout(() => replaceInputRef.current?.click(), 100); };

  const isRoot = folderStack.length === 1;
  const showSectionHints = isRoot && folders.length === 0 && files.length === 0 && !isLoading;

  return (
    <div className="max-w-5xl space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {folderStack.length > 1 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={navigateBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
            {folderStack.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <button
                  onClick={() => navigateTo(i)}
                  className={`truncate max-w-[120px] ${
                    i === folderStack.length - 1
                      ? "font-heading text-lg sm:text-xl font-bold text-foreground"
                      : "font-sans text-muted-foreground hover:text-foreground transition-colors"
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg font-sans" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> Nova pasta
          </Button>
          <Button
            size="sm"
            className="rounded-lg font-sans"
            style={{ backgroundColor: "#243d4d", color: "#f1f1f1" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isQuotaFull}
          >
            <Upload className="h-4 w-4 mr-1" /> Enviar
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplaceUpload} />
        </div>
      </div>

      {/* ── Storage quota ── */}
      <Card className="border-border/40">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="card-icon-box">
            <HardDrive />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-sans text-muted-foreground">
                {formatSize(storageUsedBytes)} de {formatSize(quotaBytes)} usados
              </span>
              <span className="text-xs font-heading font-semibold text-foreground">{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: usagePercent > 90 ? "#c0392b" : "#243d4d",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {isQuotaFull && (
        <p className="text-xs font-sans text-destructive px-1">
          Seu armazenamento está cheio. Exclua arquivos para liberar espaço.
        </p>
      )}

      {/* ── Section hints ── */}
      {showSectionHints && (
        <div className="space-y-3">
          <p className="text-sm font-sans text-muted-foreground">
            Organize sua biblioteca pastoral criando pastas. Sugestões:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEFAULT_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.name}
                  className="cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => createFolder.mutateAsync(section.name)}
                >
                  <CardContent className="py-4 flex items-start gap-3">
                    <div className="card-icon-box">
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-heading font-semibold text-foreground">{section.name}</p>
                      <p className="text-xs font-sans text-muted-foreground leading-relaxed mt-0.5">{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && <p className="text-sm font-sans text-muted-foreground text-center py-12">Carregando…</p>}

      {/* ── Empty state ── */}
      {!isLoading && !showSectionHints && folders.length === 0 && files.length === 0 && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-sans text-muted-foreground">Esta pasta está vazia.</p>
            <p className="text-xs font-sans text-muted-foreground/70 mt-1">
              Crie subpastas ou envie arquivos para organizar seus materiais.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Folders ── */}
      {folders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {folders.map((folder, i) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Card
                className="cursor-pointer group"
                onClick={() => navigateInto(folder)}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="card-icon-box">
                      <FolderPlus />
                    </div>
                    <span className="text-sm font-sans font-medium truncate">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteFolder.mutate(folder.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Files ── */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {folders.length > 0 && (
            <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground font-medium pt-2">
              Arquivos
            </p>
          )}
          {files.map((f, i) => {
            const Icon = fileIcon(f.mime_type);
            const previewable = canPreview(f.mime_type);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="card-list-row border border-border/40 rounded-xl"
              >
                <div className="card-icon-box">
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-sans font-medium truncate text-foreground">{f.name}</p>
                  <p className="text-[11px] font-sans text-muted-foreground">
                    {formatSize(f.file_size)} · {format(new Date(f.created_at), "d MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {previewable && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handlePreview(f)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleDownload(f)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-sans">
                      <DropdownMenuItem onClick={() => openRename(f)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openReplace(f)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Substituir arquivo
                      </DropdownMenuItem>
                      {!previewable && (
                        <DropdownMenuItem onClick={() => handlePreview(f)}>
                          <Eye className="h-3.5 w-3.5 mr-2" /> Detalhes
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteFile.mutate(f)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── New Folder Dialog ── */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Nova pasta</DialogTitle>
            <DialogDescription className="text-xs font-sans">Organize seus materiais em pastas.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nome da pasta"
            className="font-sans rounded-lg"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-lg font-sans" onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
            <Button className="rounded-lg font-sans" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Dialog ── */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Renomear arquivo</DialogTitle>
            <DialogDescription className="text-xs font-sans">Digite o novo nome para o arquivo.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Novo nome"
            className="font-sans rounded-lg"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-lg font-sans" onClick={() => setRenameTarget(null)}>Cancelar</Button>
            <Button className="rounded-lg font-sans" onClick={handleRenameSubmit} disabled={!renameValue.trim() || renameFile.isPending}>
              {renameFile.isPending ? "Renomeando…" : "Renomear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog ── */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-heading truncate">{previewFile?.name}</DialogTitle>
            <DialogDescription className="text-xs font-sans">
              {previewFile && `${formatSize(previewFile.file_size)} · ${previewFile.mime_type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[200px] flex items-center justify-center">
            {previewUrl && previewFile?.mime_type.startsWith("image/") ? (
              <img src={previewUrl} alt={previewFile.name} className="max-h-[60vh] object-contain rounded-lg" />
            ) : previewUrl && previewFile?.mime_type.includes("pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg border" title={previewFile.name} />
            ) : (
              <div className="text-center space-y-3 px-4">
                <File className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-sm font-sans font-medium text-foreground">
                  Pré-visualização não disponível
                </p>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {previewFile?.mime_type.includes("word") || previewFile?.mime_type.includes("document")
                    ? "Arquivos do Word ainda não podem ser visualizados diretamente na plataforma. Você pode baixar o arquivo para abri-lo."
                    : previewFile?.mime_type.includes("sheet") || previewFile?.mime_type.includes("excel")
                    ? "Planilhas do Excel ainda não podem ser visualizadas diretamente na plataforma. Você pode baixar o arquivo para abri-lo."
                    : "Este tipo de arquivo não pode ser visualizado diretamente. Você pode baixar o arquivo para abri-lo."}
                </p>
                {previewUrl && (
                  <Button size="sm" className="rounded-lg font-sans" onClick={() => window.open(previewUrl, "_blank")}>
                    <Download className="h-4 w-4 mr-1" /> Baixar arquivo
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Upload Panel (floating toast) ── */}
      <UploadPanel
        items={upload.items}
        visible={upload.visible}
        onRemove={upload.removeItem}
        onClearCompleted={upload.clearCompleted}
        onDismiss={upload.dismiss}
      />
    </div>
  );
}
