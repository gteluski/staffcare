import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Church, MapPin, Sparkles, Plane, Loader2, BookHeart } from "lucide-react";
import { useMinistryHistory, useMissionaryTrips, useSpiritualExperiences } from "@/hooks/useMinistry";
import type { MinistryHistory, MissionaryTrip, SpiritualExperience } from "@/hooks/useMinistry";
import { MinistryHistoryDialog } from "@/components/diario/MinistryHistoryDialog";
import { MissionaryTripDialog } from "@/components/diario/MissionaryTripDialog";
import { SpiritualExperienceDialog } from "@/components/diario/SpiritualExperienceDialog";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="card-empty">
      <div className="card-icon-box !h-12 !w-12 mb-3">
        <Icon className="!h-6 !w-6" />
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground/80 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return "";
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
}

export default function DiarioMinisterial() {
  const history = useMinistryHistory();
  const trips = useMissionaryTrips();
  const spiritual = useSpiritualExperiences();

  const [historyDialog, setHistoryDialog] = useState(false);
  const [editHistory, setEditHistory] = useState<MinistryHistory | null>(null);
  const [tripDialog, setTripDialog] = useState(false);
  const [editTrip, setEditTrip] = useState<MissionaryTrip | null>(null);
  const [spiritDialog, setSpiritDialog] = useState(false);
  const [editSpirit, setEditSpirit] = useState<SpiritualExperience | null>(null);
  const [deleteId, setDeleteId] = useState<{ type: string; id: string } | null>(null);

  const loading = history.isLoading || trips.isLoading || spiritual.isLoading;

  // ---- Handlers ----
  const handleSaveHistory = async (data: any) => {
    try {
      if (editHistory) {
        await history.update.mutateAsync({ id: editHistory.id, ...data });
        toast({ title: "Experiência atualizada" });
      } else {
        await history.create.mutateAsync(data);
        toast({ title: "Experiência registrada" });
      }
      setHistoryDialog(false);
      setEditHistory(null);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const handleSaveTrip = async (data: any) => {
    try {
      if (editTrip) {
        await trips.update.mutateAsync({ id: editTrip.id, ...data });
        toast({ title: "Viagem atualizada" });
      } else {
        await trips.create.mutateAsync(data);
        toast({ title: "Viagem registrada" });
      }
      setTripDialog(false);
      setEditTrip(null);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const handleSaveSpirit = async (data: any) => {
    try {
      if (editSpirit) {
        await spiritual.update.mutateAsync({ id: editSpirit.id, ...data });
        toast({ title: "Experiência atualizada" });
      } else {
        await spiritual.create.mutateAsync(data);
        toast({ title: "Experiência registrada" });
      }
      setSpiritDialog(false);
      setEditSpirit(null);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (deleteId.type === "history") await history.remove.mutateAsync(deleteId.id);
      else if (deleteId.type === "trip") await trips.remove.mutateAsync(deleteId.id);
      else await spiritual.remove.mutateAsync(deleteId.id);
      toast({ title: "Registro removido" });
    } catch { toast({ title: "Erro ao remover", variant: "destructive" }); }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Diário Ministerial</h1>
        <p className="text-muted-foreground text-sm mt-1">Registre sua jornada pastoral, viagens missionárias e experiências com Deus.</p>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="historico" className="flex-1 min-w-[120px] gap-1.5">
            <Church className="h-4 w-4" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="viagens" className="flex-1 min-w-[120px] gap-1.5">
            <Plane className="h-4 w-4" /> Viagens
          </TabsTrigger>
          <TabsTrigger value="experiencias" className="flex-1 min-w-[120px] gap-1.5">
            <Sparkles className="h-4 w-4" /> Experiências
          </TabsTrigger>
        </TabsList>

        {/* ========== HISTÓRICO MINISTERIAL ========== */}
        <TabsContent value="historico" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditHistory(null); setHistoryDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Experiência
            </Button>
          </div>

          {(history.data?.length ?? 0) === 0 ? (
            <EmptyState icon={Church} title="Nenhum registro ainda" description="Comece registrando suas experiências ministeriais e pastorais." />
          ) : (
            <div className="space-y-3">
              {history.data!.map((h) => (
                <Card key={h.id} className="relative group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{h.ministry_function}</Badge>
                          {h.is_current && <Badge className="text-xs bg-primary/15 text-primary border-0">Igreja Atual</Badge>}
                        </div>
                        <h3 className="font-heading font-semibold text-foreground truncate">{h.church_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {h.city} · {h.start_year}–{h.is_current ? "Atual" : (h.end_year ?? "?")}
                        </p>
                        {h.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{h.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditHistory(h); setHistoryDialog(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId({ type: "history", id: h.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== VIAGENS MISSIONÁRIAS ========== */}
        <TabsContent value="viagens" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditTrip(null); setTripDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Viagem
            </Button>
          </div>

          {(trips.data?.length ?? 0) === 0 ? (
            <EmptyState icon={Plane} title="Nenhuma viagem registrada" description="Adicione suas experiências missionárias e viagens a serviço do Reino." />
          ) : (
            <div className="space-y-3">
              {trips.data!.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-semibold text-foreground truncate">{t.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {t.location || "Local não informado"}
                          {t.start_date && <> · {formatDate(t.start_date)}{t.end_date ? ` — ${formatDate(t.end_date)}` : ""}</>}
                        </p>
                        {t.church_community && <p className="text-xs text-muted-foreground mt-1">🏛 {t.church_community}</p>}
                        {t.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTrip(t); setTripDialog(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId({ type: "trip", id: t.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== EXPERIÊNCIAS COM DEUS ========== */}
        <TabsContent value="experiencias" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditSpirit(null); setSpiritDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Experiência
            </Button>
          </div>

          {(spiritual.data?.length ?? 0) === 0 ? (
            <EmptyState icon={BookHeart} title="Nenhuma experiência registrada" description="Comece a registrar os momentos em que Deus se manifestou em sua vida e ministério." />
          ) : (
            <div className="space-y-3">
              {spiritual.data!.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-semibold text-foreground truncate">{s.title}</h3>
                        {s.experience_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.experience_date)}</p>
                        )}
                        {s.experience_text && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{s.experience_text}</p>}
                        {s.words_from_god && (
                          <p className="text-sm italic text-primary/80 mt-2 line-clamp-2">✝ {s.words_from_god}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditSpirit(s); setSpiritDialog(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId({ type: "spiritual", id: s.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MinistryHistoryDialog
        open={historyDialog}
        onOpenChange={(v) => { setHistoryDialog(v); if (!v) setEditHistory(null); }}
        initial={editHistory}
        onSave={handleSaveHistory}
        saving={history.create.isPending || history.update.isPending}
      />
      <MissionaryTripDialog
        open={tripDialog}
        onOpenChange={(v) => { setTripDialog(v); if (!v) setEditTrip(null); }}
        initial={editTrip}
        onSave={handleSaveTrip}
        saving={trips.create.isPending || trips.update.isPending}
      />
      <SpiritualExperienceDialog
        open={spiritDialog}
        onOpenChange={(v) => { setSpiritDialog(v); if (!v) setEditSpirit(null); }}
        initial={editSpirit}
        onSave={handleSaveSpirit}
        saving={spiritual.create.isPending || spiritual.update.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Remover registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
