import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  Download, ShieldAlert, FileJson, FileSpreadsheet, History, GitCompare, TrendingDown, TrendingUp,
  Trash2, StickyNote, Search, X,
} from "lucide-react";

type Outcome = "pass" | "fail" | "warn" | "pending" | "running" | "skipped";
type Group = "self" | "cross" | "role" | "sensitive" | "manual";
type Confidence = "high" | "medium" | "low";
type Severity = "critical" | "high" | "medium" | "low";

type ScenarioRunCtx = { userId: string; isAdmin: boolean; safeMode: boolean };
type ScenarioOutput = { outcome: Outcome; actual: string; notes?: string };

type Scenario = {
  id: string;
  name: string;
  group: Group;
  expected: string;
  roleTested: "any authenticated" | "standard user" | "admin";
  dataScope: string;
  automated: boolean;
  writeProbe: boolean;        // true => may attempt an INSERT/UPDATE that must fail
  confidence: Confidence;
  severity: Severity;         // severity of a FAIL
  recommendation: string;     // shown when failing
  manualSteps?: string[];
  run: (ctx: ScenarioRunCtx) => Promise<ScenarioOutput>;
};

type Result = ScenarioOutput & { scenarioId: string; ranAt: string | null };

const GROUP_LABEL: Record<Group, string> = {
  self: "Acesso ao próprio dado",
  cross: "Isolamento cross-user",
  role: "Limite de roles",
  sensitive: "Dados sensíveis / admin-only",
  manual: "Checagens manuais (2 contas)",
};

// Helper: assert all returned rows belong to the current user
async function ownerOnly(table: any, userId: string): Promise<ScenarioOutput> {
  const { data, error } = await supabase.from(table).select("id, user_id").limit(200);
  if (error) return { outcome: "fail", actual: `Erro: ${error.message}` };
  const foreign = (data ?? []).filter((r: any) => r.user_id !== userId).length;
  if (foreign > 0) return { outcome: "fail", actual: `${foreign} registros de outros usuários expostos` };
  return { outcome: "pass", actual: `${data?.length ?? 0} registros, todos próprios` };
}

const SCENARIOS: Scenario[] = [
  // ───── SELF ─────
  {
    id: "self_profile_read",
    name: "Próprio profile retornável",
    group: "self", expected: "Exatamente 1 registro (próprio)",
    roleTested: "any authenticated", dataScope: "profiles",
    automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Revisar policy SELECT em profiles (auth.uid() = id).",
    run: async ({ userId }) => {
      const { data, error } = await supabase.from("profiles").select("id").eq("id", userId);
      if (error) return { outcome: "fail", actual: `Erro: ${error.message}` };
      const ok = data?.length === 1 && data[0].id === userId;
      return { outcome: ok ? "pass" : "fail", actual: `Retornou ${data?.length ?? 0} registro(s)` };
    },
  },
  { id: "self_events", name: "Eventos: somente próprios", group: "self",
    expected: "Todos events.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "events", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em events.",
    run: async ({ userId }) => ownerOnly("events", userId) },
  { id: "self_tasks", name: "Tarefas: somente próprias", group: "self",
    expected: "Todos tasks.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "tasks", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em tasks.",
    run: async ({ userId }) => ownerOnly("tasks", userId) },
  { id: "self_documents", name: "Documentos: somente próprios", group: "self",
    expected: "Todos documents.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "documents", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em documents.",
    run: async ({ userId }) => ownerOnly("documents", userId) },
  { id: "self_library_files", name: "Biblioteca: arquivos do dono", group: "self",
    expected: "Todos library_files.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "library_files", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em library_files.",
    run: async ({ userId }) => ownerOnly("library_files", userId) },
  { id: "self_notes", name: "Notas: somente próprias", group: "self",
    expected: "Todos notes.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "notes", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em notes.",
    run: async ({ userId }) => ownerOnly("notes", userId) },
  { id: "self_financial", name: "Financeiro: lançamentos próprios", group: "self",
    expected: "Todos financial_entries.user_id = auth.uid()", roleTested: "any authenticated",
    dataScope: "financial_entries", automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy SELECT em financial_entries.",
    run: async ({ userId }) => ownerOnly("financial_entries", userId) },

  // ───── CROSS-USER ─────
  {
    id: "cross_profiles_count",
    name: "Profiles globais não vazam para o usuário",
    group: "cross", expected: "SELECT em profiles retorna apenas o próprio",
    roleTested: "any authenticated", dataScope: "profiles",
    automated: true, writeProbe: false, confidence: "high", severity: "critical",
    recommendation: "RLS de profiles está exposta. Garantir USING (auth.uid() = id).",
    run: async ({ userId }) => {
      const { data, error } = await supabase.from("profiles").select("id").limit(50);
      if (error) return { outcome: "fail", actual: `Erro: ${error.message}` };
      const foreign = (data ?? []).filter((r) => r.id !== userId).length;
      return foreign > 0
        ? { outcome: "fail", actual: `${foreign} profiles alheios visíveis` }
        : { outcome: "pass", actual: "Apenas o próprio profile retornado" };
    },
  },
  {
    id: "cross_write_insert_blocked",
    name: "INSERT cross-tenant em notes deve falhar",
    group: "cross", expected: "INSERT com user_id falso é rejeitado",
    roleTested: "any authenticated", dataScope: "notes",
    automated: true, writeProbe: true, confidence: "medium", severity: "critical",
    recommendation: "Reforçar WITH CHECK (auth.uid() = user_id) em notes.",
    run: async ({ safeMode }) => {
      if (safeMode) return { outcome: "skipped", actual: "Pulado em modo seguro (write probe)" };
      const fakeUserId = "00000000-0000-0000-0000-000000000001";
      const { data, error } = await supabase
        .from("notes").insert({ user_id: fakeUserId, title: "__rls_probe__", content: "" })
        .select().maybeSingle();
      if (data) {
        await supabase.from("notes").delete().eq("id", data.id);
        return { outcome: "fail", actual: "INSERT cross-tenant aceito (RLS quebrada)" };
      }
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return { outcome: "warn", actual: "Sem dados e sem erro" };
    },
  },
  {
    id: "cross_write_update_blocked",
    name: "UPDATE em ID alheio não afeta linhas",
    group: "cross", expected: "0 linhas atualizadas ou erro RLS",
    roleTested: "any authenticated", dataScope: "notes",
    automated: true, writeProbe: true, confidence: "medium", severity: "critical",
    recommendation: "Reforçar USING (auth.uid() = user_id) em UPDATE de notes.",
    run: async ({ safeMode }) => {
      if (safeMode) return { outcome: "skipped", actual: "Pulado em modo seguro (write probe)" };
      const fakeId = "00000000-0000-0000-0000-000000000099";
      const { data, error } = await supabase
        .from("notes").update({ title: "__rls_probe__" }).eq("id", fakeId).select();
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return (data?.length ?? 0) === 0
        ? { outcome: "pass", actual: "0 linhas atualizadas" }
        : { outcome: "fail", actual: `${data?.length} linhas atualizadas` };
    },
  },

  // ───── ROLE BOUNDARIES ─────
  {
    id: "role_user_roles_self",
    name: "user_roles: somente roles do próprio usuário",
    group: "role", expected: "Todos user_roles.user_id = auth.uid()",
    roleTested: "any authenticated", dataScope: "user_roles",
    automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar SELECT em user_roles e função has_role.",
    run: async ({ userId }) => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role").limit(50);
      if (error) return { outcome: "fail", actual: `Erro: ${error.message}` };
      const foreign = (data ?? []).filter((r) => r.user_id !== userId).length;
      return foreign > 0
        ? { outcome: "fail", actual: `${foreign} roles alheias visíveis` }
        : { outcome: "pass", actual: `${data?.length ?? 0} role(s) próprias` };
    },
  },
  {
    id: "role_no_self_elevation",
    name: "Auto-elevação para admin é bloqueada",
    group: "role", expected: "INSERT em user_roles para self+admin é negado",
    roleTested: "any authenticated", dataScope: "user_roles",
    automated: true, writeProbe: true, confidence: "high", severity: "critical",
    recommendation: "Manter policy 'Deny direct insert on user_roles'. Atribuir roles apenas via trigger SECURITY DEFINER.",
    run: async ({ userId, safeMode }) => {
      if (safeMode) return { outcome: "skipped", actual: "Pulado em modo seguro (write probe)" };
      const { data, error } = await supabase
        .from("user_roles").insert({ user_id: userId, role: "admin" as const })
        .select().maybeSingle();
      if (data) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        return { outcome: "fail", actual: "Auto-elevação aceita (CRÍTICO)" };
      }
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return { outcome: "warn", actual: "Sem retorno e sem erro" };
    },
  },
  {
    id: "role_webhook_admin_only",
    name: "webhook_events legível para admin",
    group: "role", expected: "Admin lê; não-admin recebe 0 ou erro",
    roleTested: "admin", dataScope: "webhook_events",
    automated: true, writeProbe: false, confidence: "high", severity: "high",
    recommendation: "Verificar policy 'Admins can view webhook_events' usando has_role().",
    run: async ({ isAdmin }) => {
      const { data, error } = await supabase.from("webhook_events").select("id").limit(5);
      if (isAdmin) {
        if (error) return { outcome: "fail", actual: `Admin bloqueado: ${error.message}` };
        return { outcome: "pass", actual: `Admin lê ok (${data?.length ?? 0} registros)` };
      }
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.message}` };
      return (data?.length ?? 0) === 0
        ? { outcome: "pass", actual: "0 registros (RLS aplicada)" }
        : { outcome: "fail", actual: `Não-admin viu ${data?.length} registros` };
    },
  },

  // ───── SENSITIVE / ADMIN-ONLY ─────
  {
    id: "sensitive_subscription_scope",
    name: "Subscriptions: usuário comum vê apenas a própria",
    group: "sensitive", expected: "Não-admin: somente próprias. Admin: todas.",
    roleTested: "any authenticated", dataScope: "subscriptions",
    automated: true, writeProbe: false, confidence: "high", severity: "critical",
    recommendation: "Validar policies de subscriptions e admin-only writes.",
    run: async ({ userId, isAdmin }) => {
      const { data, error } = await supabase.from("subscriptions").select("user_id").limit(50);
      if (error) return { outcome: "fail", actual: `Erro: ${error.message}` };
      const total = data?.length ?? 0;
      const foreign = (data ?? []).filter((r) => r.user_id !== userId).length;
      if (isAdmin) return { outcome: "pass", actual: `Admin: ${total} subscriptions visíveis (esperado)` };
      return foreign > 0
        ? { outcome: "fail", actual: `${foreign} subscriptions alheias expostas` }
        : { outcome: "pass", actual: `${total} subscription(s) próprias` };
    },
  },
  {
    id: "sensitive_subscription_no_user_write",
    name: "Subscriptions: usuário não consegue editar",
    group: "sensitive", expected: "UPDATE direto em subscription falha (não-admin)",
    roleTested: "standard user", dataScope: "subscriptions",
    automated: true, writeProbe: true, confidence: "medium", severity: "critical",
    recommendation: "Manter 'Deny user update on subscriptions'. Apenas admin/service_role escreve.",
    run: async ({ userId, isAdmin, safeMode }) => {
      if (isAdmin) return { outcome: "skipped", actual: "Sessão é admin — cenário avalia política de não-admin" };
      if (safeMode) return { outcome: "skipped", actual: "Pulado em modo seguro (write probe)" };
      const { data, error } = await supabase
        .from("subscriptions").update({ notes: "__rls_probe__" }).eq("user_id", userId).select();
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return (data?.length ?? 0) === 0
        ? { outcome: "pass", actual: "0 linhas atualizadas" }
        : { outcome: "fail", actual: `${data?.length} linhas atualizadas (CRÍTICO)` };
    },
  },
  {
    id: "sensitive_profile_settings_no_write",
    name: "profile_settings: leitura sim, escrita não",
    group: "sensitive", expected: "SELECT funciona, UPDATE direto falha",
    roleTested: "any authenticated", dataScope: "profile_settings",
    automated: true, writeProbe: true, confidence: "medium", severity: "high",
    recommendation: "Manter policies 'Deny user update/insert/delete on profile_settings'.",
    run: async ({ userId, safeMode }) => {
      if (safeMode) return { outcome: "skipped", actual: "Pulado em modo seguro (write probe)" };
      const { data, error } = await supabase
        .from("profile_settings").update({ onboarding_completed: true }).eq("id", userId).select();
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return (data?.length ?? 0) === 0
        ? { outcome: "pass", actual: "0 linhas atualizadas" }
        : { outcome: "fail", actual: "UPDATE direto aceito (deveria ser via edge function)" };
    },
  },
  {
    id: "sensitive_doctrinal_no_direct",
    name: "doctrinal_chunks: SELECT direto bloqueado",
    group: "sensitive", expected: "SELECT direto retorna 0/erro; acesso só via RPC",
    roleTested: "any authenticated", dataScope: "doctrinal_chunks",
    automated: true, writeProbe: false, confidence: "high", severity: "medium",
    recommendation: "Manter policy 'Deny authenticated direct access to doctrinal_chunks'.",
    run: async () => {
      const { data, error } = await supabase.from("doctrinal_chunks").select("id").limit(5);
      if (error) return { outcome: "pass", actual: `Bloqueado: ${error.code ?? error.message}` };
      return (data?.length ?? 0) === 0
        ? { outcome: "pass", actual: "0 registros via SELECT direto (esperado)" }
        : { outcome: "fail", actual: `${data?.length} registros expostos` };
    },
  },

  // ───── MANUAL ─────
  {
    id: "manual_two_accounts",
    name: "Isolamento cross-account (2 contas reais)",
    group: "manual", expected: "Conta A nunca vê dados criados pela Conta B",
    roleTested: "standard user", dataScope: "events / tasks / library / notes",
    automated: false, writeProbe: false, confidence: "high", severity: "critical",
    recommendation: "Se houver vazamento, verificar a policy SELECT da tabela afetada.",
    manualSteps: [
      "Abra duas janelas anônimas em navegadores separados.",
      "Logue na Conta A e anote IDs/títulos visíveis em Agenda, Tarefas, Biblioteca e Notas.",
      "Logue na Conta B e crie 1 evento, 1 tarefa, 1 nota e faça 1 upload.",
      "Volte para Conta A, faça refresh e confirme que NENHUM dos itens da Conta B aparece.",
      "Tente acessar URLs/IDs específicos da Conta B na Conta A — devem retornar vazio.",
    ],
    run: async () => ({ outcome: "pending", actual: "Executar walkthrough manual." }),
  },
  {
    id: "manual_storage_isolation",
    name: "Storage: download cruzado de arquivos privados",
    group: "manual", expected: "Tentativa de baixar file_path da Conta B na Conta A retorna 403/404",
    roleTested: "standard user", dataScope: "storage: biblioteca, avatars",
    automated: false, writeProbe: false, confidence: "high", severity: "critical",
    recommendation: "Revisar storage policies dos buckets 'biblioteca' e 'avatars'.",
    manualSteps: [
      "Na Conta B, faça upload de um arquivo na Biblioteca e copie o file_path do registro em library_files.",
      "Na Conta A, abra o console do app e rode: supabase.storage.from('biblioteca').createSignedUrl('<path-da-B>', 60).",
      "Esperado: erro de policy ou objeto não encontrado.",
      "Repita para o bucket 'avatars' usando o avatar_url da Conta B.",
      "Esperado: download deve falhar para qualquer path que não seja prefixado pelo auth.uid() do solicitante.",
    ],
    run: async () => ({ outcome: "pending", actual: "Executar walkthrough manual." }),
  },
  {
    id: "manual_admin_view_user",
    name: "Admin vê assinaturas, usuário comum não vê de outros",
    group: "manual", expected: "Admin lê todas; user comum só a própria",
    roleTested: "admin", dataScope: "subscriptions",
    automated: false, writeProbe: false, confidence: "medium", severity: "high",
    recommendation: "Revisar policies 'Admins can view all subscriptions' e 'Users can view own subscription'.",
    manualSteps: [
      "Na Conta B (não-admin), abra /assinatura e confirme que vê apenas o próprio status.",
      "Na Conta A (admin), abra /admin/webhooks e confirme que eventos de outros usuários estão visíveis.",
      "Confirme que admin NÃO consegue ver dados pessoais de outros módulos (events/tasks) — admin não é superuser de conteúdo.",
    ],
    run: async () => ({ outcome: "pending", actual: "Executar walkthrough manual." }),
  },
];

function outcomeBadge(o: Outcome) {
  switch (o) {
    case "pass":    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Pass</Badge>;
    case "fail":    return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Fail</Badge>;
    case "warn":    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Atenção</Badge>;
    case "running": return <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Rodando</Badge>;
    case "skipped": return <Badge variant="outline">Pulado</Badge>;
    default:        return <Badge variant="outline">Pendente</Badge>;
  }
}

function severityBadge(s: Severity) {
  const map: Record<Severity, string> = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <Badge className={`${map[s]} hover:${map[s]}`}>{s}</Badge>;
}

function confidenceBadge(c: Confidence) {
  return <Badge variant="outline" className="text-xs">conf: {c}</Badge>;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

type AuditRunRow = {
  id: string;
  ran_at: string;
  executor_email: string | null;
  safe_mode: boolean;
  total_pass: number;
  total_fail: number;
  total_warn: number;
  total_skipped: number;
  total_pending: number;
  critical_failures: number;
  snapshot: Array<{ scenario_id: string; outcome: Outcome; severity: Severity; name: string }>;
  notes: string | null;
};

export default function RLSValidator() {
  const { user, isAdmin, loading } = useAuth();
  const [results, setResults] = useState<Record<string, Result>>(() =>
    Object.fromEntries(
      SCENARIOS.map((s) => [s.id, { scenarioId: s.id, outcome: "pending" as Outcome, actual: "—", ranAt: null }]),
    ),
  );
  const [running, setRunning] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [history, setHistory] = useState<AuditRunRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [lastSavedRunId, setLastSavedRunId] = useState<string | null>(null);
  const [runNotes, setRunNotes] = useState("");
  const [keepN, setKeepN] = useState<number>(20);
  const [pruning, setPruning] = useState(false);
  const [totalRuns, setTotalRuns] = useState<number>(0);
  const [baselineId, setBaselineId] = useState<string | "auto">("auto");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [searchText, setSearchText] = useState<string>("");
  const [persistBaselineId, setPersistBaselineId] = useState<boolean>(false);

  // Hydrate UI filter prefs from localStorage (admin-only, browser-local).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rls-audit:ui-prefs");
      if (!raw) return;
      const p = JSON.parse(raw) as {
        severityFilter?: Severity | "all";
        baselineId?: string | "auto";
        searchText?: string;
        persistBaselineId?: boolean;
      };
      if (p.severityFilter) setSeverityFilter(p.severityFilter);
      if (typeof p.searchText === "string") setSearchText(p.searchText);
      if (typeof p.persistBaselineId === "boolean") setPersistBaselineId(p.persistBaselineId);
      // Only restore concrete baselineId if user opted in; otherwise keep "auto".
      if (p.persistBaselineId && p.baselineId) setBaselineId(p.baselineId);
      else if (p.baselineId === "auto") setBaselineId("auto");
    } catch { /* ignore corrupt prefs */ }
  }, []);

  // Persist UI filter prefs whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(
        "rls-audit:ui-prefs",
        JSON.stringify({
          severityFilter,
          baselineId: persistBaselineId ? baselineId : "auto",
          searchText,
          persistBaselineId,
        }),
      );
    } catch { /* ignore quota */ }
  }, [severityFilter, baselineId, searchText, persistBaselineId]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const [{ data, error }, { count }] = await Promise.all([
      supabase
        .from("rls_audit_runs")
        .select("id, ran_at, executor_email, safe_mode, total_pass, total_fail, total_warn, total_skipped, total_pending, critical_failures, snapshot, notes")
        .order("ran_at", { ascending: false })
        .limit(15),
      supabase.from("rls_audit_runs").select("id", { count: "exact", head: true }),
    ]);
    if (!error && data) setHistory(data as unknown as AuditRunRow[]);
    if (typeof count === "number") setTotalRuns(count);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const runOne = async (s: Scenario) => {
    setResults((r) => ({ ...r, [s.id]: { ...r[s.id], outcome: "running", actual: "..." } }));
    try {
      const out = await s.run({ userId: user!.id, isAdmin, safeMode });
      setResults((r) => ({ ...r, [s.id]: { ...out, scenarioId: s.id, ranAt: new Date().toISOString() } }));
    } catch (e: any) {
      setResults((r) => ({ ...r, [s.id]: { outcome: "fail", actual: `Exceção: ${e.message}`, scenarioId: s.id, ranAt: new Date().toISOString() } }));
    }
  };

  const persistRun = async (finalResults: Record<string, Result>) => {
    if (!user) return;
    setSavingRun(true);
    const list = Object.values(finalResults);
    const snapshot = SCENARIOS.map((s) => ({
      scenario_id: s.id,
      name: s.name,
      outcome: finalResults[s.id].outcome,
      severity: s.severity,
    }));
    const totals = {
      pass: list.filter((r) => r.outcome === "pass").length,
      fail: list.filter((r) => r.outcome === "fail").length,
      warn: list.filter((r) => r.outcome === "warn").length,
      skipped: list.filter((r) => r.outcome === "skipped").length,
      pending: list.filter((r) => r.outcome === "pending").length,
    };
    const criticalFailures = SCENARIOS.filter(
      (s) => finalResults[s.id].outcome === "fail" && s.severity === "critical",
    ).length;
    const { data, error } = await supabase
      .from("rls_audit_runs")
      .insert({
        executor_user_id: user.id,
        executor_email: user.email ?? null,
        safe_mode: safeMode,
        total_pass: totals.pass,
        total_fail: totals.fail,
        total_warn: totals.warn,
        total_skipped: totals.skipped,
        total_pending: totals.pending,
        critical_failures: criticalFailures,
        snapshot,
        notes: runNotes.trim() || null,
      })
      .select("id")
      .single();
    if (!error && data) {
      setLastSavedRunId(data.id);
      await loadHistory();
    }
    setSavingRun(false);
  };

  const runAll = async () => {
    setRunning(true);
    const next: Record<string, Result> = { ...results };
    for (const s of SCENARIOS) {
      setResults((r) => ({ ...r, [s.id]: { ...r[s.id], outcome: "running", actual: "..." } }));
      try {
        const out = await s.run({ userId: user!.id, isAdmin, safeMode });
        next[s.id] = { ...out, scenarioId: s.id, ranAt: new Date().toISOString() };
      } catch (e: any) {
        next[s.id] = { outcome: "fail", actual: `Exceção: ${e.message}`, scenarioId: s.id, ranAt: new Date().toISOString() };
      }
      setResults((r) => ({ ...r, [s.id]: next[s.id] }));
    }
    setRunning(false);
    await persistRun(next);
  };

  const runGroup = async (g: Group) => {
    setRunning(true);
    for (const s of SCENARIOS.filter((s) => s.group === g)) await runOne(s);
    setRunning(false);
  };

  const list = Object.values(results);
  const summary = {
    pass: list.filter((r) => r.outcome === "pass").length,
    fail: list.filter((r) => r.outcome === "fail").length,
    warn: list.filter((r) => r.outcome === "warn").length,
    skipped: list.filter((r) => r.outcome === "skipped").length,
    pending: list.filter((r) => r.outcome === "pending").length,
  };

  // Normalized search predicate (id, name, dataScope).
  const normalizedSearch = searchText.trim().toLowerCase();
  const matchesSearch = (s: Scenario) => {
    if (!normalizedSearch) return true;
    return (
      s.id.toLowerCase().includes(normalizedSearch) ||
      s.name.toLowerCase().includes(normalizedSearch) ||
      s.dataScope.toLowerCase().includes(normalizedSearch)
    );
  };
  const matchesSeverity = (s: Scenario) => severityFilter === "all" || s.severity === severityFilter;
  const isInScope = (s: Scenario) => matchesSeverity(s) && matchesSearch(s);

  // Filter aware: failed scenarios shown reflect the active severity filter and search.
  const failedScenarios = SCENARIOS
    .map((s) => ({ s, r: results[s.id] }))
    .filter((x) => x.r.outcome === "fail")
    .filter((x) => isInScope(x.s));
  const criticalFails = failedScenarios.filter((x) => x.s.severity === "critical");

  const filtersActive = severityFilter !== "all" || normalizedSearch.length > 0;

  // role coverage summary (based on roles already present in this project: 'user' and 'admin')
  const roleCoverage = useMemo(() => {
    const roles: Array<"any authenticated" | "standard user" | "admin"> = ["any authenticated", "standard user", "admin"];
    return roles.map((role) => {
      const scoped = SCENARIOS.filter((s) => s.roleTested === role);
      const ran = scoped.filter((s) => ["pass", "fail", "warn"].includes(results[s.id].outcome));
      const pass = scoped.filter((s) => results[s.id].outcome === "pass").length;
      const fail = scoped.filter((s) => results[s.id].outcome === "fail").length;
      return { role, total: scoped.length, ran: ran.length, pass, fail };
    });
  }, [results]);

  const exportPayload = () => {
    const ranAt = new Date().toISOString();
    return SCENARIOS.map((s) => {
      const r = results[s.id];
      return {
        timestamp: r.ranAt ?? ranAt,
        scenario_id: s.id,
        scenario_name: s.name,
        group: s.group,
        role_tested: s.roleTested,
        data_scope: s.dataScope,
        automated: s.automated,
        write_probe: s.writeProbe,
        confidence: s.confidence,
        severity_if_fail: s.severity,
        executed_as_role: isAdmin ? "admin" : "user",
        executed_as_user: user!.id,
        expected: s.expected,
        actual: r.actual,
        outcome: r.outcome,
      };
    });
  };

  const exportJSON = () => {
    downloadBlob(
      `rls-audit-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`,
      JSON.stringify({ generated_at: new Date().toISOString(), executor: user!.email, results: exportPayload() }, null, 2),
      "application/json",
    );
  };

  const exportCSV = () => {
    const rows = exportPayload();
    const headers = Object.keys(rows[0] ?? {});
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");
    downloadBlob(
      `rls-audit-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`,
      csv,
      "text/csv",
    );
  };

  const exportDiffCSV = () => {
    if (!previousRun || !regression) {
      toast({ title: "Sem baseline", description: "Não há execução anterior para comparar.", variant: "destructive" });
      return;
    }
    const nowIso = new Date().toISOString();
    const prevIso = previousRun.ran_at;
    const sevMap = new Map(SCENARIOS.map((s) => [s.id, s.severity] as const));
    const rows = [
      ...regression.newlyFailed.map((f) => ({
        change_type: "newly_failed",
        scenario_id: f.id,
        scenario_name: f.name,
        severity: f.severity,
        previous_outcome: previousRun.snapshot.find((s) => s.scenario_id === f.id)?.outcome ?? "—",
        current_outcome: "fail",
        previous_run_at: prevIso,
        current_run_at: nowIso,
      })),
      ...regression.fixed.map((f) => ({
        change_type: "fixed",
        scenario_id: f.id,
        scenario_name: f.name,
        severity: sevMap.get(f.id) ?? "low",
        previous_outcome: "fail",
        current_outcome: "pass",
        previous_run_at: prevIso,
        current_run_at: nowIso,
      })),
    ];
    if (rows.length === 0) {
      toast({ title: "Sem diferenças", description: "Nenhuma regressão ou correção desde a execução anterior." });
      return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");
    downloadBlob(
      `rls-audit-diff-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`,
      csv,
      "text/csv",
    );
  };

  const deleteRun = async (id: string) => {
    const { error } = await supabase.from("rls_audit_runs").delete().eq("id", id);
    if (error) {
      toast({ title: "Falha ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    if (id === lastSavedRunId) setLastSavedRunId(null);
    await loadHistory();
    toast({ title: "Execução removida" });
  };

  const pruneOldRuns = async () => {
    if (!Number.isFinite(keepN) || keepN < 1) {
      toast({ title: "Valor inválido", description: "Informe um número maior ou igual a 1.", variant: "destructive" });
      return;
    }
    setPruning(true);
    // Get IDs of runs to KEEP (the most recent N), then delete everything else
    const { data: keepRows, error: selErr } = await supabase
      .from("rls_audit_runs")
      .select("id")
      .order("ran_at", { ascending: false })
      .limit(keepN);
    if (selErr) {
      toast({ title: "Falha ao consultar", description: selErr.message, variant: "destructive" });
      setPruning(false);
      return;
    }
    const keepIds = (keepRows ?? []).map((r) => r.id);
    if (keepIds.length === 0) {
      // nothing exists, nothing to prune
      setPruning(false);
      toast({ title: "Nada para remover" });
      return;
    }
    const { error: delErr, count } = await supabase
      .from("rls_audit_runs")
      .delete({ count: "exact" })
      .not("id", "in", `(${keepIds.join(",")})`);
    setPruning(false);
    if (delErr) {
      toast({ title: "Falha ao remover", description: delErr.message, variant: "destructive" });
      return;
    }
    await loadHistory();
    toast({ title: "Limpeza concluída", description: `${count ?? 0} execução(ões) antiga(s) removida(s).` });
  };

  const groups: Group[] = ["self", "cross", "role", "sensitive", "manual"];

  // Regression baseline: manual selection wins; otherwise fall back to the most
  // recent saved run (excluding the one we just saved this session).
  const previousRun = useMemo<AuditRunRow | null>(() => {
    if (!history.length) return null;
    if (baselineId !== "auto") {
      return history.find((h) => h.id === baselineId) ?? null;
    }
    const candidates = lastSavedRunId
      ? history.filter((h) => h.id !== lastSavedRunId)
      : history;
    return candidates[0] ?? null;
  }, [history, lastSavedRunId, baselineId]);

  // Severity + search filter applied to grouped scenario table and panels.
  const visibleScenarios = useMemo(
    () => SCENARIOS.filter((s) => {
      if (severityFilter !== "all" && s.severity !== severityFilter) return false;
      if (!normalizedSearch) return true;
      return (
        s.id.toLowerCase().includes(normalizedSearch) ||
        s.name.toLowerCase().includes(normalizedSearch) ||
        s.dataScope.toLowerCase().includes(normalizedSearch)
      );
    }),
    [severityFilter, normalizedSearch],
  );

  const regression = useMemo(() => {
    if (!previousRun) return null;
    const prevMap = new Map(previousRun.snapshot.map((s) => [s.scenario_id, s.outcome]));
    const newlyFailed: Array<{ id: string; name: string; severity: Severity }> = [];
    const fixed: Array<{ id: string; name: string }> = [];
    for (const s of SCENARIOS) {
      if (severityFilter !== "all" && s.severity !== severityFilter) continue;
      if (normalizedSearch && !(
        s.id.toLowerCase().includes(normalizedSearch) ||
        s.name.toLowerCase().includes(normalizedSearch) ||
        s.dataScope.toLowerCase().includes(normalizedSearch)
      )) continue;
      const cur = results[s.id].outcome;
      const prev = prevMap.get(s.id);
      if (prev === undefined) continue;
      if (cur === "fail" && prev !== "fail") {
        newlyFailed.push({ id: s.id, name: s.name, severity: s.severity });
      } else if (cur === "pass" && prev === "fail") {
        fixed.push({ id: s.id, name: s.name });
      }
    }
    return { newlyFailed, fixed };
  }, [previousRun, results, severityFilter, normalizedSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Validador & Auditoria de RLS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sondas seguras agrupadas. Modo seguro pula tentativas de escrita. Exporta JSON/CSV para auditoria.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Switch id="safe-mode" checked={safeMode} onCheckedChange={setSafeMode} />
            <Label htmlFor="safe-mode" className="text-sm cursor-pointer">Modo seguro (sem write probes)</Label>
          </div>
          <Button onClick={runAll} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Executar todos
          </Button>
        </div>
      </div>

      {/* Operator notes for next saved run */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" /> Nota desta execução (opcional)
          </CardTitle>
          <CardDescription>
            Anote contexto: deploy, migração, incidente, ambiente. Será salva junto da próxima execução completa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={runNotes}
            onChange={(e) => setRunNotes(e.target.value)}
            placeholder="Ex.: pós-deploy 2026-04-23, validando policy de subscriptions após hotfix"
            rows={2}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{runNotes.length}/500</p>
        </CardContent>
      </Card>

      {/* Filters & baseline selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros e baseline</CardTitle>
          <CardDescription>
            Filtros por severidade e busca afetam tabela, painel de regressão e diff CSV. Preferências salvas neste navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Buscar cenário (nome, id ou escopo)</Label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ex.: subscription, cross_, user_roles, library_files"
                className="pl-8 pr-9"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {visibleScenarios.length} de {SCENARIOS.length} cenário(s) visíveis com os filtros atuais.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severidade</Label>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ({SCENARIOS.length})</SelectItem>
                <SelectItem value="critical">Critical ({SCENARIOS.filter((s) => s.severity === "critical").length})</SelectItem>
                <SelectItem value="high">High ({SCENARIOS.filter((s) => s.severity === "high").length})</SelectItem>
                <SelectItem value="medium">Medium ({SCENARIOS.filter((s) => s.severity === "medium").length})</SelectItem>
                <SelectItem value="low">Low ({SCENARIOS.filter((s) => s.severity === "low").length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Baseline para regressão</Label>
            <Select value={baselineId} onValueChange={(v) => setBaselineId(v as string | "auto")}>
              <SelectTrigger><SelectValue placeholder="Automático" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (run anterior mais recente)</SelectItem>
                {history.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {new Date(h.ran_at).toLocaleString("pt-BR")} · {h.executor_email ?? "—"} · pass {h.total_pass} / fail {h.total_fail}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {previousRun && (
              <p className="text-xs text-muted-foreground">
                Usando {baselineId === "auto" ? "automático" : "manual"}: <strong>{new Date(previousRun.ran_at).toLocaleString("pt-BR")}</strong>
              </p>
            )}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={persistBaselineId}
                onChange={(e) => setPersistBaselineId(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Lembrar baseline específica entre sessões (senão usa &ldquo;Automático&rdquo;)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardHeader className="pb-2"><CardDescription>Pass</CardDescription><CardTitle className="text-2xl text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />{summary.pass}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Fail</CardDescription><CardTitle className="text-2xl text-red-700 flex items-center gap-2"><XCircle className="h-5 w-5" />{summary.fail}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Atenção</CardDescription><CardTitle className="text-2xl text-amber-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />{summary.warn}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Pulados</CardDescription><CardTitle className="text-2xl text-muted-foreground">{summary.skipped}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Pendentes</CardDescription><CardTitle className="text-2xl text-muted-foreground">{summary.pending}</CardTitle></CardHeader></Card>
      </div>

      {/* Critical failures */}
      {criticalFails.length > 0 && (
        <Card className="border-red-300 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-base text-red-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Falhas críticas detectadas ({criticalFails.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalFails.map(({ s, r }) => (
              <div key={s.id} className="text-sm border-l-2 border-red-400 pl-3">
                <div className="font-medium text-red-900">{s.name}</div>
                <div className="text-red-700">{r.actual}</div>
                <div className="text-xs text-red-600 italic mt-1">→ {s.recommendation}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Role coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cobertura por role</CardTitle>
          <CardDescription>Roles atualmente existentes no projeto: <strong>user</strong>, <strong>admin</strong>.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role testada</TableHead>
                <TableHead>Cenários</TableHead>
                <TableHead>Executados</TableHead>
                <TableHead>Pass</TableHead>
                <TableHead>Fail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleCoverage.map((rc) => (
                <TableRow key={rc.role}>
                  <TableCell className="font-medium">{rc.role}</TableCell>
                  <TableCell>{rc.total}</TableCell>
                  <TableCell>{rc.ran}</TableCell>
                  <TableCell className="text-emerald-700">{rc.pass}</TableCell>
                  <TableCell className="text-red-700">{rc.fail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grouped scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cenários agrupados</CardTitle>
          <CardDescription>
            Executando como <strong>{user?.email}</strong> ({isAdmin ? "admin" : "user"}). Modo seguro: <strong>{safeMode ? "ON" : "OFF"}</strong>.
          </CardDescription>
          {filtersActive && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">escopo filtrado</Badge>
              {severityFilter !== "all" && (
                <Badge variant="outline" className="text-xs">severidade: {severityFilter}</Badge>
              )}
              {normalizedSearch && (
                <Badge variant="outline" className="text-xs">busca: &ldquo;{searchText}&rdquo;</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {visibleScenarios.length} / {SCENARIOS.length} cenário(s)
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={groups}>
            {groups.map((g) => {
              const items = visibleScenarios.filter((s) => s.group === g);
              if (items.length === 0) return null;
              const groupFails = items.filter((s) => results[s.id].outcome === "fail").length;
              return (
                <AccordionItem key={g} value={g}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 flex-1 pr-3">
                      <span className="font-medium">{GROUP_LABEL[g]}</span>
                      <Badge variant="outline">{items.length}</Badge>
                      {groupFails > 0 && <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">{groupFails} fail</Badge>}
                      <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => runGroup(g)} disabled={running}>Rodar grupo</Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[220px]">Cenário</TableHead>
                            <TableHead>Cobertura</TableHead>
                            <TableHead>Esperado</TableHead>
                            <TableHead className="min-w-[200px]">Real</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Severidade</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((s) => {
                            const r = results[s.id];
                            return (
                              <TableRow key={s.id}>
                                <TableCell>
                                  <div className="font-medium">{s.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">scope: {s.dataScope}</div>
                                  {s.manualSteps && (
                                    <details className="mt-2 text-xs">
                                      <summary className="cursor-pointer text-primary">Ver passos manuais</summary>
                                      <ol className="list-decimal pl-5 mt-1 space-y-1 text-muted-foreground">
                                        {s.manualSteps.map((st, i) => <li key={i}>{st}</li>)}
                                      </ol>
                                    </details>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">{s.roleTested}</Badge>
                                    <Badge variant="outline" className="text-xs">{s.automated ? "auto" : "manual"}</Badge>
                                    {s.writeProbe && <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 text-xs">write probe</Badge>}
                                    {confidenceBadge(s.confidence)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">{s.expected}</TableCell>
                                <TableCell className="text-xs max-w-[280px] break-words">
                                  {r.actual}
                                  {r.outcome === "fail" && (
                                    <div className="text-xs text-red-700 italic mt-1">→ {s.recommendation}</div>
                                  )}
                                </TableCell>
                                <TableCell>{outcomeBadge(r.outcome)}</TableCell>
                                <TableCell>{severityBadge(s.severity)}</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="ghost" onClick={() => runOne(s)} disabled={running}>Rodar</Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Regression vs previous run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4" /> Regressão vs execução anterior
          </CardTitle>
          <CardDescription>
            {previousRun
              ? <>Baseline {baselineId === "auto" ? "automática" : "manual"}: <strong>{new Date(previousRun.ran_at).toLocaleString("pt-BR")}</strong> ({previousRun.executor_email ?? "—"}, modo seguro: {previousRun.safe_mode ? "ON" : "OFF"}).</>
              : "Nenhuma execução anterior salva ainda. Rode 'Executar todos' para criar a primeira baseline."}
          </CardDescription>
          {previousRun && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {filtersActive ? (
                <>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-xs">comparação filtrada</Badge>
                  {severityFilter !== "all" && <Badge variant="outline" className="text-xs">severidade: {severityFilter}</Badge>}
                  {normalizedSearch && <Badge variant="outline" className="text-xs">busca: &ldquo;{searchText}&rdquo;</Badge>}
                </>
              ) : (
                <Badge variant="outline" className="text-xs">comparação completa (sem filtros)</Badge>
              )}
            </div>
          )}
        </CardHeader>
        {regression && (
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-700" />
                <span className="text-sm font-medium">Novas falhas ({regression.newlyFailed.length})</span>
              </div>
              {regression.newlyFailed.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-6">Nenhuma regressão detectada.</p>
              ) : (
                <ul className="space-y-1 pl-6">
                  {regression.newlyFailed.map((f) => (
                    <li key={f.id} className="text-sm flex items-center gap-2">
                      <span className="text-red-800">{f.name}</span>
                      {severityBadge(f.severity)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-medium">Cenários corrigidos ({regression.fixed.length})</span>
              </div>
              {regression.fixed.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-6">Nenhum cenário previamente falho passou agora.</p>
              ) : (
                <ul className="space-y-1 pl-6">
                  {regression.fixed.map((f) => (
                    <li key={f.id} className="text-sm text-emerald-800">{f.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico de execuções
              </CardTitle>
              <CardDescription>
                Mostrando {history.length} de <strong>{totalRuns}</strong> execuções salvas. Persistência em <code>rls_audit_runs</code> (admin-only).
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={loadHistory} disabled={historyLoading}>
              {historyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Retention controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-muted/30">
            <Label htmlFor="keep-n" className="text-sm whitespace-nowrap">Manter as últimas</Label>
            <Input
              id="keep-n"
              type="number"
              min={1}
              max={500}
              value={keepN}
              onChange={(e) => setKeepN(parseInt(e.target.value || "0", 10))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">execuções (remove o restante)</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={pruning || totalRuns <= keepN} className="sm:ml-auto">
                  {pruning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  Limpar antigas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover execuções antigas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Serão removidas todas as execuções fora das <strong>{keepN}</strong> mais recentes.
                    Esta ação é irreversível e afeta o histórico de auditoria.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={pruneOldRuns}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução salva ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Safe</TableHead>
                    <TableHead>Pass</TableHead>
                    <TableHead>Fail</TableHead>
                    <TableHead>Críticas</TableHead>
                    <TableHead>Atenção</TableHead>
                    <TableHead>Pulados</TableHead>
                    <TableHead className="min-w-[160px]">Nota</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id} className={h.id === lastSavedRunId ? "bg-emerald-50/40" : undefined}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(h.ran_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{h.executor_email ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{h.safe_mode ? "ON" : "OFF"}</Badge></TableCell>
                      <TableCell className="text-emerald-700">{h.total_pass}</TableCell>
                      <TableCell className="text-red-700">{h.total_fail}</TableCell>
                      <TableCell className={h.critical_failures > 0 ? "text-red-800 font-semibold" : "text-muted-foreground"}>{h.critical_failures}</TableCell>
                      <TableCell className="text-amber-700">{h.total_warn}</TableCell>
                      <TableCell className="text-muted-foreground">{h.total_skipped}</TableCell>
                      <TableCell className="text-xs max-w-[240px] break-words text-muted-foreground">
                        {h.notes || <span className="italic">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir esta execução?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Execução de {new Date(h.ran_at).toLocaleString("pt-BR")} ({h.executor_email ?? "—"}). Não pode ser desfeito.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRun(h.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {savingRun && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando execução…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Exportar relatório</CardTitle>
          <CardDescription>
            JSON/CSV exportam todos os cenários. <strong>Diff CSV</strong> respeita os filtros ativos
            {filtersActive
              ? <> (<span className="font-medium">escopo:</span> {severityFilter !== "all" ? `severidade=${severityFilter}` : "qualquer severidade"}{normalizedSearch ? `, busca="${searchText}"` : ""}).</>
              : <> (sem filtros — diff completo).</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJSON}><FileJson className="h-4 w-4 mr-2" />Exportar JSON</Button>
          <Button variant="outline" onClick={exportCSV}><FileSpreadsheet className="h-4 w-4 mr-2" />Exportar CSV</Button>
          <Button variant="outline" onClick={exportDiffCSV} disabled={!previousRun}>
            <GitCompare className="h-4 w-4 mr-2" />Exportar diff CSV
            {filtersActive && <Badge variant="outline" className="ml-2 text-[10px]">filtrado</Badge>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notas de auditoria</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Modo seguro</strong> pula sondas que escrevem (INSERT/UPDATE que devem falhar). Desligue apenas em janela de auditoria.</p>
          <p>• Sondas <strong>nunca</strong> desabilitam RLS — usam apenas a sessão admin atual.</p>
          <p>• Cenários com confiança <strong>medium</strong> dependem do servidor retornar erro/0-rows, o que pode mudar conforme versão do PostgREST.</p>
          <p>• Cobertura de role <em>standard user</em> rodando como admin é <strong>parcialmente inferida</strong> — para certeza completa use o walkthrough manual de 2 contas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
