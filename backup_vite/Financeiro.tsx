import { useState, useMemo, useEffect } from "react";
import { format, isPast, isToday, addDays, startOfMonth, endOfMonth, subMonths, addMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, TrendingUp, TrendingDown, AlertTriangle, Wallet, Trash2,
  Home, CreditCard, Shield, Heart, Gift, Car, UtensilsCrossed, Tag,
  ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import {
  useFinancial, type FinancialEntry, type FinInsert, type EntryType, type FinCategory,
} from "@/hooks/useFinancial";
import type { LucideIcon } from "lucide-react";

const CAT_META: Record<FinCategory, { icon: LucideIcon; label: string }> = {
  Aluguel: { icon: Home, label: "Aluguel" },
  Cartão: { icon: CreditCard, label: "Cartão" },
  INSS: { icon: Shield, label: "INSS" },
  Dízimo: { icon: Heart, label: "Dízimo" },
  Oferta: { icon: Gift, label: "Oferta" },
  Transporte: { icon: Car, label: "Transporte" },
  Alimentação: { icon: UtensilsCrossed, label: "Alimentação" },
  Outro: { icon: Tag, label: "Outro" },
};
const CAT_LIST = Object.keys(CAT_META) as FinCategory[];

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Financeiro() {
  const { data: entries = [], isLoading, createEntry, updateEntry, deleteEntry } = useFinancial();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialEntry | null>(null);
  const [tab, setTab] = useState("resumo");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("despesa");
  const [category, setCategory] = useState<FinCategory>("Outro");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setTitle(editing.title);
      setAmount(String(editing.amount));
      setEntryType(editing.entry_type);
      setCategory(editing.category);
      setDueDate(editing.due_date || "");
      setDescription(editing.description || "");
      setPaid(editing.paid);
    } else {
      setTitle(""); setAmount(""); setEntryType("despesa"); setCategory("Outro");
      setDueDate(""); setDescription(""); setPaid(false);
    }
  }, [dialogOpen, editing]);

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(",", "."));
    if (!title.trim() || isNaN(num)) return;
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(), amount: num, entry_type: entryType, category,
        due_date: dueDate || null, description: description.trim() || null, paid,
      };
      if (editing) {
        if (paid && !editing.paid) payload.paid_at = new Date().toISOString();
        if (!paid) payload.paid_at = null;
        await updateEntry.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createEntry.mutateAsync(payload as FinInsert);
      }
      setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteEntry.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setDialogOpen(false);
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (e: FinancialEntry) => { setEditing(e); setDialogOpen(true); };

  // Month-filtered entries
  const monthEntries = useMemo(() => {
    return entries.filter((e) => {
      const ref = e.due_date ? new Date(e.due_date) : new Date(e.created_at);
      return isSameMonth(ref, selectedMonth);
    });
  }, [entries, selectedMonth]);

  const receitas = useMemo(() => monthEntries.filter((e) => e.entry_type === "receita"), [monthEntries]);
  const despesas = useMemo(() => monthEntries.filter((e) => e.entry_type === "despesa"), [monthEntries]);
  const totalReceitas = useMemo(() => receitas.reduce((s, e) => s + Number(e.amount), 0), [receitas]);
  const totalDespesas = useMemo(() => despesas.reduce((s, e) => s + Number(e.amount), 0), [despesas]);

  // Upcoming due dates (global, not filtered by month)
  const upcoming = useMemo(() => {
    const limit = addDays(new Date(), 30);
    return entries
      .filter((e) => !e.paid && e.due_date && new Date(e.due_date) <= limit)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [entries]);

  const togglePaid = (entry: FinancialEntry) =>
    updateEntry.mutate({ id: entry.id, paid: !entry.paid, paid_at: !entry.paid ? new Date().toISOString() : null });

  const monthLabel = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Financeiro</h1>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo lançamento</Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors capitalize"
          onClick={() => setSelectedMonth(new Date())}
          title="Ir para o mês atual"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {monthLabel}
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={TrendingUp} label="Receitas do mês" value={currency(totalReceitas)} color="text-emerald-600" />
        <SummaryCard icon={TrendingDown} label="Despesas do mês" value={currency(totalDespesas)} color="text-red-600" />
        <SummaryCard icon={Wallet} label="Saldo do mês" value={currency(totalReceitas - totalDespesas)}
          color={totalReceitas - totalDespesas >= 0 ? "text-emerald-600" : "text-red-600"} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="receitas">Receitas ({receitas.length})</TabsTrigger>
          <TabsTrigger value="despesas">Despesas ({despesas.length})</TabsTrigger>
          <TabsTrigger value="vencimentos">Vencimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          {monthEntries.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center text-center">
                <Wallet className="h-10 w-10 text-muted-foreground/25 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum lançamento em {monthLabel}.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Registre receitas e despesas para acompanhar suas finanças pastorais.</p>
                <Button size="sm" className="mt-4" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo lançamento</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" /> Próximos vencimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {upcoming.slice(0, 5).map((e) => <EntryRow key={e.id} entry={e} onClick={openEdit} onTogglePaid={togglePaid} />)}
                  </CardContent>
                </Card>
              )}

              {/* Category breakdown for the month */}
              <CategoryBreakdown entries={monthEntries} />

              <EntryList title={`Lançamentos de ${monthLabel}`} entries={monthEntries} onClick={openEdit} onTogglePaid={togglePaid} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="receitas">
          <EntryList title="Receitas" entries={receitas} onClick={openEdit} emptyMsg="Nenhuma receita neste mês."
            onTogglePaid={togglePaid} />
        </TabsContent>

        <TabsContent value="despesas">
          <EntryList title="Despesas" entries={despesas} onClick={openEdit} emptyMsg="Nenhuma despesa neste mês."
            onTogglePaid={togglePaid} />
        </TabsContent>

        <TabsContent value="vencimentos">
          <EntryList title="Próximos vencimentos" entries={upcoming} onClick={openEdit} emptyMsg="Nenhum vencimento pendente nos próximos 30 dias."
            onTogglePaid={togglePaid} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
            <DialogDescription className="text-xs">{editing ? "Altere os campos e salve." : "Registre uma receita ou despesa."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input placeholder="Ex: Dízimo de janeiro" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FinCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAT_LIST.map((c) => {
                      const m = CAT_META[c]; const I = m.icon;
                      return <SelectItem key={c} value={c}><span className="flex items-center gap-2"><I className="h-3.5 w-3.5" />{m.label}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vencimento (opcional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="fin-paid" checked={paid} onCheckedChange={(v) => setPaid(!!v)} />
              <Label htmlFor="fin-paid" className="text-sm">Já pago/recebido</Label>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea rows={2} placeholder="Detalhes…" value={description} onChange={(e) => setDescription(e.target.value)} />
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
            <Button onClick={handleSubmit} disabled={saving || !title.trim() || !amount}>
              {saving ? "Salvando…" : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O lançamento <strong>"{deleteTarget?.title}"</strong> será removido permanentemente. Essa ação não pode ser desfeita.
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

function SummaryCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({ entries }: { entries: FinancialEntry[] }) {
  const byCategory = useMemo(() => {
    const map: Record<string, { receita: number; despesa: number }> = {};
    for (const e of entries) {
      if (!map[e.category]) map[e.category] = { receita: 0, despesa: 0 };
      map[e.category][e.entry_type] += Number(e.amount);
    }
    return Object.entries(map)
      .map(([cat, totals]) => ({ category: cat as FinCategory, ...totals, total: totals.despesa + totals.receita }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  if (byCategory.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Resumo por categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {byCategory.map(({ category, receita, despesa }) => {
          const meta = CAT_META[category] || CAT_META.Outro;
          const Icon = meta.icon;
          return (
            <div key={category} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="min-w-[80px] font-medium">{meta.label}</span>
              {receita > 0 && <span className="text-emerald-600 text-xs">+{currency(receita)}</span>}
              {despesa > 0 && <span className="text-red-600 text-xs">−{currency(despesa)}</span>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EntryList({ title, entries, onClick, onTogglePaid, emptyMsg }: {
  title: string; entries: FinancialEntry[]; onClick: (e: FinancialEntry) => void;
  onTogglePaid: (e: FinancialEntry) => void; emptyMsg?: string;
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMsg || "Nenhum lançamento encontrado."}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.map((e) => <EntryRow key={e.id} entry={e} onClick={onClick} onTogglePaid={onTogglePaid} />)}
      </CardContent>
    </Card>
  );
}

function EntryRow({ entry, onClick, onTogglePaid }: { entry: FinancialEntry; onClick: (e: FinancialEntry) => void; onTogglePaid: (e: FinancialEntry) => void }) {
  const cat = CAT_META[entry.category] || CAT_META.Outro;
  const Icon = cat.icon;
  const isReceita = entry.entry_type === "receita";
  const overdue = !entry.paid && entry.due_date && isPast(new Date(entry.due_date)) && !isToday(new Date(entry.due_date));

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-accent/30 transition-colors ${entry.paid ? "opacity-60" : ""}`}
      onClick={() => onClick(entry)}
    >
      <Checkbox checked={entry.paid} onClick={(e) => e.stopPropagation()} onCheckedChange={() => onTogglePaid(entry)} className="shrink-0" />
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${entry.paid ? "line-through text-muted-foreground" : ""}`}>{entry.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{cat.label}</span>
          {entry.due_date && (
            <span className={overdue ? "text-red-600 font-medium" : ""}>
              {format(new Date(entry.due_date), "d MMM", { locale: ptBR })}
              {overdue && " · Vencido"}
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${isReceita ? "text-emerald-600" : "text-red-600"}`}>
        {isReceita ? "+" : "−"} {currency(Number(entry.amount))}
      </span>
    </div>
  );
}
