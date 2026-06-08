import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus, Mic, BookOpen, MapPin, Church, Trash2, Presentation, X,
  ArrowLeft, List, HighlighterIcon, StickyNote, Filter,
} from "lucide-react";
import { useSermons, type Sermon, type SermonInsert, type SermonStatus, type LocationType } from "@/hooks/useSermons";
import { useAuth } from "@/hooks/useAuth";

const STATUS_META: Record<SermonStatus, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-muted text-muted-foreground" },
  preparado: { label: "Preparado", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  pregado: { label: "Pregado", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

type ViewFilter = "all" | "local" | "externa";

export default function Pregacoes() {
  const { data: sermons = [], isLoading, createSermon, updateSermon, deleteSermon } = useSermons();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sermon | null>(null);
  const [preaching, setPreaching] = useState<Sermon | null>(null);
  const [locationFilter, setLocationFilter] = useState<ViewFilter>("all");

  // Form
  const [title, setTitle] = useState("");
  const [bibleText, setBibleText] = useState("");
  const [mainPoints, setMainPoints] = useState("");
  const [speechHighlights, setSpeechHighlights] = useState("");
  const [notes, setNotes] = useState("");
  const [sermonDate, setSermonDate] = useState("");
  const [locationType, setLocationType] = useState<LocationType>("local");
  const [churchName, setChurchName] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [status, setStatus] = useState<SermonStatus>("rascunho");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setTitle(editing.title); setBibleText(editing.bible_text || "");
      setMainPoints(editing.main_points || ""); setSpeechHighlights(editing.speech_highlights || "");
      setNotes(editing.notes || ""); setSermonDate(editing.sermon_date || "");
      setLocationType(editing.location_type); setChurchName(editing.church_name || "");
      setSeriesName(editing.series_name || ""); setStatus(editing.status);
    } else {
      setTitle(""); setBibleText(""); setMainPoints(""); setSpeechHighlights("");
      setNotes(""); setSermonDate(""); setLocationType("local"); setChurchName("");
      setSeriesName(""); setStatus("rascunho");
    }
  }, [dialogOpen, editing]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        bible_text: bibleText.trim() || null,
        main_points: mainPoints.trim() || null,
        speech_highlights: speechHighlights.trim() || null,
        notes: notes.trim() || null,
        sermon_date: sermonDate || null,
        location_type: locationType,
        church_name: locationType === "externa" ? (churchName.trim() || null) : null,
        series_name: seriesName.trim() || null,
        status,
      };
      if (editing) {
        await updateSermon.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createSermon.mutateAsync(payload as SermonInsert);
      }
      setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSermon.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setDialogOpen(false);
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: Sermon) => { setEditing(s); setDialogOpen(true); };

  // Filtered lists
  const filtered = useMemo(() => {
    if (locationFilter === "all") return sermons;
    return sermons.filter((s) => s.location_type === locationFilter);
  }, [sermons, locationFilter]);

  const upcoming = filtered.filter((s) => s.status !== "pregado");
  const preached = filtered.filter((s) => s.status === "pregado");

  // Group upcoming by month
  const upcomingByMonth = useMemo(() => {
    const groups: Record<string, Sermon[]> = {};
    for (const s of upcoming) {
      const key = s.sermon_date
        ? format(parseISO(s.sermon_date), "yyyy-MM")
        : "sem-data";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === "sem-data") return 1;
        if (b === "sem-data") return -1;
        return a.localeCompare(b);
      })
      .map(([key, items]) => ({
        label: key === "sem-data" ? "Sem data definida" : format(parseISO(key + "-01"), "MMMM 'de' yyyy", { locale: ptBR }),
        items,
      }));
  }, [upcoming]);

  // Series list
  const seriesList = useMemo(() => {
    const set = new Set<string>();
    for (const s of sermons) if (s.series_name) set.add(s.series_name);
    return Array.from(set).sort();
  }, [sermons]);

  // Stats
  const localCount = sermons.filter((s) => s.location_type === "local").length;
  const externaCount = sermons.filter((s) => s.location_type === "externa").length;

  const localChurch = profile?.church_name;

  // Preaching mode
  if (preaching) {
    return <PreachingMode sermon={preaching} localChurch={localChurch} onClose={() => setPreaching(null)} />;
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Pregações</h1>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova pregação</Button>
      </div>

      {/* Quick stats */}
      {sermons.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <span>{sermons.length} pregaç{sermons.length !== 1 ? "ões" : "ão"} total</span>
          <span className="text-border">·</span>
          <span>{localCount} na igreja local</span>
          <span className="text-border">·</span>
          <span>{externaCount} em igrejas externas</span>
          {seriesList.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{seriesList.length} série{seriesList.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      )}

      {/* Location filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex gap-1">
          {(["all", "local", "externa"] as ViewFilter[]).map((f) => (
            <Button key={f} variant={locationFilter === f ? "secondary" : "ghost"} size="sm" className="h-7 text-xs"
              onClick={() => setLocationFilter(f)}>
              {f === "all" ? "Todas" : f === "local" ? "Igreja local" : "Igrejas externas"}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="todas">Todas ({filtered.length})</TabsTrigger>
          {seriesList.length > 0 && <TabsTrigger value="series">Séries</TabsTrigger>}
        </TabsList>

        <TabsContent value="calendario">
          {upcoming.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center text-center">
                <Mic className="h-10 w-10 text-muted-foreground/25 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma pregação planejada.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Planeje suas próximas pregações e organize seus esboços.</p>
                <Button size="sm" className="mt-4" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Planejar pregação</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingByMonth.map(({ label, items }) => (
                <div key={label} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{label}</p>
                  {items.map((s) => (
                    <SermonRow key={s.id} sermon={s} localChurch={localChurch} onClick={openEdit} onPreach={() => setPreaching(s)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas">
          {filtered.length === 0 && !isLoading ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhuma pregação registrada.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Próximas / Em preparação ({upcoming.length})</p>
                  {upcoming.map((s) => <SermonRow key={s.id} sermon={s} localChurch={localChurch} onClick={openEdit} onPreach={() => setPreaching(s)} />)}
                </div>
              )}
              {preached.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Pregadas ({preached.length})</p>
                  {preached.map((s) => <SermonRow key={s.id} sermon={s} localChurch={localChurch} onClick={openEdit} onPreach={() => setPreaching(s)} />)}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {seriesList.length > 0 && (
          <TabsContent value="series">
            <div className="space-y-4">
              {seriesList.map((series) => {
                const items = filtered.filter((s) => s.series_name === series);
                if (items.length === 0) return null;
                return (
                  <div key={series} className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <List className="h-3.5 w-3.5" /> {series} ({items.length})
                    </p>
                    {items.map((s) => (
                      <SermonRow key={s.id} sermon={s} localChurch={localChurch} onClick={openEdit} onPreach={() => setPreaching(s)} />
                    ))}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar pregação" : "Nova pregação"}</DialogTitle>
            <DialogDescription className="text-xs">Preencha os dados do sermão.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título do sermão</Label>
              <Input placeholder="Ex: A graça que transforma" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Texto bíblico</Label>
              <Input placeholder="Ex: Romanos 12:1-2" value={bibleText} onChange={(e) => setBibleText(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={sermonDate} onChange={(e) => setSermonDate(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SermonStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="preparado">Preparado</SelectItem>
                    <SelectItem value="pregado">Pregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Local</Label>
                <Select value={locationType} onValueChange={(v) => setLocationType(v as LocationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Igreja local{localChurch ? ` (${localChurch})` : ""}</SelectItem>
                    <SelectItem value="externa">Igreja externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {locationType === "externa" && (
                <div>
                  <Label>Nome da igreja</Label>
                  <Input placeholder="Igreja Metodista de…" value={churchName} onChange={(e) => setChurchName(e.target.value)} />
                </div>
              )}
            </div>
            <div>
              <Label>Série (opcional)</Label>
              <Input placeholder="Ex: Série sobre Romanos" value={seriesName} onChange={(e) => setSeriesName(e.target.value)}
                list="series-suggestions" />
              {seriesList.length > 0 && (
                <datalist id="series-suggestions">
                  {seriesList.map((s) => <option key={s} value={s} />)}
                </datalist>
              )}
            </div>
            <div>
              <Label>Pontos principais</Label>
              <Textarea rows={3} placeholder="Liste os pontos principais do sermão…" value={mainPoints} onChange={(e) => setMainPoints(e.target.value)} />
            </div>
            <div>
              <Label>Destaques de fala</Label>
              <Textarea rows={2} placeholder="Frases ou citações para enfatizar…" value={speechHighlights} onChange={(e) => setSpeechHighlights(e.target.value)} />
            </div>
            <div>
              <Label>Anotações</Label>
              <Textarea rows={2} placeholder="Observações pessoais…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editing && (
              <Button variant="destructive" size="sm" className="mr-auto" disabled={saving}
                onClick={() => setDeleteTarget(editing)}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
              {saving ? "Salvando…" : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir pregação?</AlertDialogTitle>
            <AlertDialogDescription>
              A pregação <strong>"{deleteTarget?.title}"</strong> será removida permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SermonRow({ sermon, localChurch, onClick, onPreach }: {
  sermon: Sermon; localChurch?: string | null; onClick: (s: Sermon) => void; onPreach: () => void;
}) {
  const st = STATUS_META[sermon.status];
  const churchDisplay = sermon.location_type === "local"
    ? (localChurch || "Igreja local")
    : sermon.church_name;

  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors group"
      onClick={() => onClick(sermon)}
    >
      <Mic className="h-4.5 w-4.5 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{sermon.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
          {sermon.bible_text && (
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{sermon.bible_text}</span>
          )}
          {sermon.sermon_date && (
            <span>{format(parseISO(sermon.sermon_date), "d MMM yyyy", { locale: ptBR })}</span>
          )}
          {churchDisplay && (
            <span className="flex items-center gap-1">
              {sermon.location_type === "externa" ? <MapPin className="h-3 w-3" /> : <Church className="h-3 w-3" />}
              {churchDisplay}
            </span>
          )}
          {sermon.series_name && (
            <span className="flex items-center gap-1"><List className="h-3 w-3" />{sermon.series_name}</span>
          )}
        </div>
      </div>
      <Badge variant="secondary" className={`text-[10px] ${st.class}`}>{st.label}</Badge>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
        title="Abrir Modo Pregação"
        onClick={(e) => { e.stopPropagation(); onPreach(); }}>
        <Presentation className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Preaching Mode ───────────────────────────────────────────────────
function PreachingMode({ sermon, localChurch, onClose }: { sermon: Sermon; localChurch?: string | null; onClose: () => void }) {
  const churchDisplay = sermon.location_type === "local"
    ? (localChurch || "Igreja local")
    : sermon.church_name;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Presentation className="h-3.5 w-3.5" /> Modo Pregação
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
          {/* Title block */}
          <div className="text-center space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {sermon.title}
            </h1>
            {sermon.bible_text && (
              <p className="text-lg text-primary font-medium flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5" /> {sermon.bible_text}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
              {sermon.sermon_date && (
                <span>{format(parseISO(sermon.sermon_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              )}
              {churchDisplay && (
                <span className="flex items-center gap-1">
                  {sermon.location_type === "externa" ? <MapPin className="h-3.5 w-3.5" /> : <Church className="h-3.5 w-3.5" />}
                  {churchDisplay}
                </span>
              )}
            </div>
            {sermon.series_name && (
              <p className="text-xs text-muted-foreground/70">Série: {sermon.series_name}</p>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Main Points */}
          {sermon.main_points && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <List className="h-4 w-4" /> Pontos Principais
              </h2>
              <div className="text-lg sm:text-xl leading-[1.9] text-foreground whitespace-pre-wrap font-heading">
                {sermon.main_points}
              </div>
            </section>
          )}

          {/* Speech Highlights */}
          {sermon.speech_highlights && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <HighlighterIcon className="h-4 w-4" /> Destaques de Fala
              </h2>
              <div className="bg-accent/40 rounded-xl px-6 py-5 text-lg sm:text-xl leading-[1.9] text-foreground whitespace-pre-wrap font-heading italic">
                {sermon.speech_highlights}
              </div>
            </section>
          )}

          {/* Notes */}
          {sermon.notes && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <StickyNote className="h-4 w-4" /> Anotações
              </h2>
              <div className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {sermon.notes}
              </div>
            </section>
          )}

          {/* Empty */}
          {!sermon.main_points && !sermon.speech_highlights && !sermon.notes && (
            <div className="text-center py-16">
              <Mic className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Este sermão ainda não tem conteúdo.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Edite a pregação e adicione pontos principais, destaques e anotações.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
