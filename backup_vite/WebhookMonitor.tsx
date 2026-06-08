import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type WebhookEvent = {
  id: string;
  provider: string;
  environment: string;
  event_type: string;
  event_id: string | null;
  status: string;
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  error_message: string | null;
  payload_summary: Record<string, unknown> | null;
  received_at: string;
  processed_at: string | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "processed", label: "Processado" },
  { value: "received", label: "Recebido" },
  { value: "ignored", label: "Ignorado" },
  { value: "failed", label: "Falhou" },
  { value: "invalid_signature", label: "Assinatura inválida" },
  { value: "security", label: "⚠ Segurança (assinatura inválida)" },
  { value: "slow", label: "⏱ Latência alta (≥3s)" },
  { value: "retries", label: "↻ Possíveis retentativas" },
];

const RANGE_OPTIONS = [
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "all", label: "Tudo" },
];

// --- Operator-configurable alert thresholds (persisted in localStorage) ---
type AlertThresholds = {
  invalidSignatureMax: number; // count today
  failedMax: number;           // count today
  slowLatencyMs: number;       // per-event latency considered slow
};
const DEFAULT_THRESHOLDS: AlertThresholds = {
  invalidSignatureMax: 1,
  failedMax: 3,
  slowLatencyMs: 3000,
};
const THRESHOLDS_STORAGE_KEY = "webhookMonitor:thresholds:v1";

function loadThresholds(): AlertThresholds {
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw);
    return {
      invalidSignatureMax: Number.isFinite(parsed.invalidSignatureMax) ? parsed.invalidSignatureMax : DEFAULT_THRESHOLDS.invalidSignatureMax,
      failedMax: Number.isFinite(parsed.failedMax) ? parsed.failedMax : DEFAULT_THRESHOLDS.failedMax,
      slowLatencyMs: Number.isFinite(parsed.slowLatencyMs) ? parsed.slowLatencyMs : DEFAULT_THRESHOLDS.slowLatencyMs,
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "processed":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Processado</Badge>;
    case "received":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Recebido</Badge>;
    case "ignored":
      return <Badge variant="outline">Ignorado</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Falhou</Badge>;
    case "invalid_signature":
      return (
        <Badge className="bg-red-600 text-white border-red-700 hover:bg-red-600 gap-1">
          <ShieldAlert className="h-3 w-3" />
          Assinatura inválida
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Latency in ms between received_at and processed_at. Null if not processed.
function latencyMs(e: { received_at: string; processed_at: string | null }): number | null {
  if (!e.processed_at) return null;
  const d = new Date(e.processed_at).getTime() - new Date(e.received_at).getTime();
  return Number.isFinite(d) && d >= 0 ? d : null;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function latencyBadge(ms: number | null, slowMs: number) {
  if (ms === null) return <span className="text-muted-foreground">—</span>;
  if (ms >= slowMs) {
    return (
      <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 font-mono text-[11px]">
        {formatLatency(ms)}
      </Badge>
    );
  }
  return <span className="font-mono text-[11px] text-muted-foreground">{formatLatency(ms)}</span>;
}

function rangeStartIso(range: string): string | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

export default function WebhookMonitor() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("24h");
  const [search, setSearch] = useState("");
  const [thresholds, setThresholds] = useState<AlertThresholds>(() => loadThresholds());
  const [selected, setSelected] = useState<WebhookEvent | null>(null);
  // Incident workflow: selected event ids + per-event operator notes.
  const [incidentIds, setIncidentIds] = useState<Set<string>>(new Set());
  const [incidentNotes, setIncidentNotes] = useState<Record<string, string>>({});
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const toggleIncident = (id: string, checked: boolean) => {
    setIncidentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const clearIncidents = () => {
    setIncidentIds(new Set());
    setIncidentNotes({});
  };
  const markAllVisible = () => {
    setIncidentIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((e) => next.add(e.id));
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(thresholds));
    } catch {
      /* ignore */
    }
  }, [thresholds]);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [authLoading, isAdmin, navigate]);

  const fetchEvents = async () => {
    setLoading(true);
    let q = supabase
      .from("webhook_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(500);

    const startIso = rangeStartIso(rangeFilter);
    if (startIso) q = q.gte("received_at", startIso);
    // Synthetic filters (security/slow/retries) are applied client-side below.
    if (
      statusFilter !== "all" &&
      statusFilter !== "security" &&
      statusFilter !== "slow" &&
      statusFilter !== "retries"
    ) {
      q = q.eq("status", statusFilter);
    }
    if (typeFilter !== "all") q = q.eq("event_type", typeFilter);

    const { data, error } = await q;
    if (!error && data) {
      setEvents(data as WebhookEvent[]);
      const types = Array.from(new Set((data as WebhookEvent[]).map((e) => e.event_type))).sort();
      setEventTypes((prev) => Array.from(new Set([...prev, ...types])).sort());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, statusFilter, typeFilter, rangeFilter]);

  // Retry detection: count occurrences per (event_type + stripe object reference).
  // Heuristic — Stripe may legitimately re-deliver the same event_id on failure,
  // and may also send multiple distinct events for the same object. We surface both
  // as "possible retry/duplicate" so operators can investigate.
  const retryGroups = useMemo(() => {
    const byEventId = new Map<string, number>();
    const byObjectKey = new Map<string, number>();
    for (const e of events) {
      if (e.event_id) {
        byEventId.set(e.event_id, (byEventId.get(e.event_id) ?? 0) + 1);
      }
      const ref = e.stripe_subscription_id || e.stripe_customer_id;
      if (ref) {
        const key = `${e.event_type}::${ref}`;
        byObjectKey.set(key, (byObjectKey.get(key) ?? 0) + 1);
      }
    }
    return { byEventId, byObjectKey };
  }, [events]);

  type RetryKind = "none" | "event_id_duplicate" | "object_repeat";
  type RetryInfo = {
    retry: boolean;
    kind: RetryKind;
    count: number;
    reason: string;
    detail: string;
  };

  const isLikelyRetry = (e: WebhookEvent): RetryInfo => {
    if (e.event_id && (retryGroups.byEventId.get(e.event_id) ?? 0) > 1) {
      const count = retryGroups.byEventId.get(e.event_id)!;
      return {
        retry: true,
        kind: "event_id_duplicate",
        count,
        reason: "event_id duplicado",
        detail:
          "Mesmo event_id recebido mais de uma vez — forte indício de retentativa do Stripe após 2xx ausente/timeout.",
      };
    }
    const ref = e.stripe_subscription_id || e.stripe_customer_id;
    if (ref) {
      const key = `${e.event_type}::${ref}`;
      const count = retryGroups.byObjectKey.get(key) ?? 0;
      if (count > 1) {
        return {
          retry: true,
          kind: "object_repeat",
          count,
          reason: "mesmo objeto + tipo",
          detail:
            "Múltiplos eventos do mesmo tipo para o mesmo objeto Stripe — pode ser retentativa OU eventos legítimos sucessivos (ex.: updates rápidos).",
        };
      }
    }
    return { retry: false, kind: "none", count: 1, reason: "", detail: "" };
  };

  const filtered = useMemo(() => {
    let list = events;

    if (statusFilter === "security") {
      list = list.filter((e) => e.status === "invalid_signature");
    } else if (statusFilter === "slow") {
      list = list.filter((e) => {
        const ms = latencyMs(e);
        return ms !== null && ms >= thresholds.slowLatencyMs;
      });
    } else if (statusFilter === "retries") {
      list = list.filter((e) => isLikelyRetry(e).retry);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((e) =>
        [e.event_type, e.event_id, e.stripe_customer_id, e.stripe_subscription_id, e.user_id, e.error_message]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, search, statusFilter, retryGroups, thresholds.slowLatencyMs]);

  const summary = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEvents = events.filter((e) => new Date(e.received_at) >= todayStart);
    const failedToday = todayEvents.filter((e) => e.status === "failed" || e.status === "invalid_signature");
    const lastSuccess = events.find((e) => e.status === "processed");
    const lastFailed = events.find((e) => e.status === "failed" || e.status === "invalid_signature");

    const invalidSigToday = todayEvents.filter((e) => e.status === "invalid_signature").length;

    // Average latency over the most recent 50 processed events
    const recentProcessed = events
      .filter((e) => e.status === "processed" && e.processed_at)
      .slice(0, 50);
    const latencies = recentProcessed
      .map((e) => latencyMs(e))
      .filter((v): v is number => v !== null);
    const avgLatency = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
    const maxLatency = latencies.length ? Math.max(...latencies) : null;
    const slowCount = latencies.filter((v) => v >= thresholds.slowLatencyMs).length;

    return {
      totalToday: todayEvents.length,
      failedToday: failedToday.length,
      lastSuccess,
      lastFailed,
      invalidSigToday,
      avgLatency,
      maxLatency,
      slowCount,
      latencySample: latencies.length,
    };
  }, [events, thresholds.slowLatencyMs]);

  const breaches = useMemo(() => {
    return {
      invalidSig: summary.invalidSigToday >= thresholds.invalidSignatureMax && thresholds.invalidSignatureMax > 0,
      failed: summary.failedToday >= thresholds.failedMax && thresholds.failedMax > 0,
      slow: summary.slowCount > 0,
    };
  }, [summary, thresholds]);
  const anyBreach = breaches.invalidSig || breaches.failed || breaches.slow;

  // Build incident records from selected events
  const buildIncidentRecords = () => {
    const byId = new Map(events.map((e) => [e.id, e]));
    const records: Array<Record<string, unknown>> = [];
    incidentIds.forEach((id) => {
      const e = byId.get(id);
      if (!e) return;
      const ms = latencyMs(e);
      const retry = isLikelyRetry(e);
      // Map retry kind to explicit confidence level
      const retryConfidence = retry.kind === "event_id_duplicate" ? "high" : retry.kind === "object_repeat" ? "medium" : "none";
      records.push({
        internal_id: e.id,
        event_id: e.event_id,
        event_type: e.event_type,
        environment: e.environment,
        status: e.status,
        received_at: e.received_at,
        processed_at: e.processed_at,
        latency_ms: ms,
        stripe_customer_id: e.stripe_customer_id,
        stripe_subscription_id: e.stripe_subscription_id,
        user_id: e.user_id,
        error_message: e.error_message,
        retry_flag: retry.retry,
        retry_confidence: retryConfidence,
        retry_kind: retry.kind,
        retry_count: retry.retry ? retry.count : null,
        retry_reason: retry.reason || null,
        operator_note: incidentNotes[e.id]?.trim() || null,
      });
    });
    return records;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportIncidents = () => {
    const records = buildIncidentRecords();
    if (!records.length) {
      toast({ title: "Nenhum incidente selecionado", description: "Marque eventos na tabela para exportar." });
      return;
    }
    const ts = format(new Date(), "yyyyMMdd-HHmmss");

    // Build monitor scope metadata for export context
    const scopeMeta = {
      date_range: rangeFilter,
      status_filter: statusFilter,
      event_type_filter: typeFilter,
      search_text: search.trim() || null,
    };

    if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify({
        exported_at: new Date().toISOString(),
        count: records.length,
        scope: scopeMeta,
        incidents: records,
      }, null, 2)], { type: "application/json" });
      downloadBlob(blob, `webhook-incidents-${ts}.json`);
    } else {
      // CSV: include scope as header comments for context
      const headers = Object.keys(records[0]);
      const escape = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "string" ? v : JSON.stringify(v);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines: string[] = [];
      // Add scope metadata as comments at top
      lines.push(`# Exported: ${new Date().toISOString()}`);
      lines.push(`# Scope: range=${scopeMeta.date_range}, status=${scopeMeta.status_filter}, type=${scopeMeta.event_type_filter}, search=${scopeMeta.search_text || "(none)"}`);
      lines.push(headers.join(","));
      records.forEach((r) => lines.push(headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")));
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      downloadBlob(blob, `webhook-incidents-${ts}.csv`);
    }
    toast({ title: `Exportado: ${records.length} incidente(s)`, description: `Formato ${exportFormat.toUpperCase()}` });
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitor de Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Saúde operacional dos webhooks Stripe — admin only.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Alert breaches */}
      {anyBreach && (
        <div className="rounded-md border border-red-300 bg-red-50/70 p-3 text-sm text-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 shrink-0" />
            <div className="space-y-1">
              <div className="font-medium">Limite de alerta atingido</div>
              <ul className="list-disc pl-5 text-xs space-y-0.5">
                {breaches.invalidSig && (
                  <li>
                    Assinaturas inválidas hoje: <strong>{summary.invalidSigToday}</strong> (limite ≥ {thresholds.invalidSignatureMax})
                  </li>
                )}
                {breaches.failed && (
                  <li>
                    Falhas hoje: <strong>{summary.failedToday}</strong> (limite ≥ {thresholds.failedMax})
                  </li>
                )}
                {breaches.slow && (
                  <li>
                    Eventos lentos na amostra recente: <strong>{summary.slowCount}</strong> (≥ {formatLatency(thresholds.slowLatencyMs)})
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Eventos hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.totalToday}</div>
          </CardContent>
        </Card>
        <Card className={breaches.failed ? "border-red-400 bg-red-50/40" : summary.failedToday > 0 ? "border-red-200" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Falhas hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${summary.failedToday > 0 ? "text-red-700" : ""}`}>
              {summary.failedToday}
            </div>
            <div className="text-xs text-muted-foreground">limite: ≥ {thresholds.failedMax}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Último sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {summary.lastSuccess?.event_type ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.lastSuccess
                ? formatDistanceToNow(new Date(summary.lastSuccess.received_at), { addSuffix: true, locale: ptBR })
                : "Nenhum"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" /> Última falha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {summary.lastFailed?.event_type ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.lastFailed
                ? formatDistanceToNow(new Date(summary.lastFailed.received_at), { addSuffix: true, locale: ptBR })
                : "Nenhuma"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational signals: latency + signature */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Latência média (últimos {summary.latencySample || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatLatency(summary.avgLatency)}</div>
            <div className="text-xs text-muted-foreground">
              Pico: {formatLatency(summary.maxLatency)}
            </div>
          </CardContent>
        </Card>
        <Card className={summary.slowCount > 0 ? "border-amber-300 bg-amber-50/40" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Eventos lentos (≥{formatLatency(thresholds.slowLatencyMs)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${summary.slowCount > 0 ? "text-amber-700" : ""}`}>
              {summary.slowCount}
            </div>
            <div className="text-xs text-muted-foreground">na amostra recente</div>
          </CardContent>
        </Card>
        <Card className={breaches.invalidSig ? "border-red-500 bg-red-50/60" : summary.invalidSigToday > 0 ? "border-red-300 bg-red-50/40" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Assinaturas inválidas hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${summary.invalidSigToday > 0 ? "text-red-700" : ""}`}>
              {summary.invalidSigToday}
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.invalidSigToday > 0
                ? `limite: ≥ ${thresholds.invalidSignatureMax} — investigue segredo/origem`
                : `limite: ≥ ${thresholds.invalidSignatureMax}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Possíveis retentativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {events.filter((e) => isLikelyRetry(e).retry).length}
            </div>
            <div className="text-xs text-muted-foreground">
              event_id repetido ou mesmo objeto+tipo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Select value={rangeFilter} onValueChange={setRangeFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por ID, customer, sub, erro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:flex-1"
          />
        </CardContent>
      </Card>

      {/* Alert thresholds editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Limites de alerta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="th-sig" className="text-xs">Assinaturas inválidas hoje (≥)</Label>
            <Input
              id="th-sig"
              type="number"
              min={1}
              value={thresholds.invalidSignatureMax}
              onChange={(e) => setThresholds((t) => ({ ...t, invalidSignatureMax: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="th-fail" className="text-xs">Falhas hoje (≥)</Label>
            <Input
              id="th-fail"
              type="number"
              min={1}
              value={thresholds.failedMax}
              onChange={(e) => setThresholds((t) => ({ ...t, failedMax: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="th-slow" className="text-xs">Latência lenta (ms)</Label>
            <Input
              id="th-slow"
              type="number"
              min={100}
              step={100}
              value={thresholds.slowLatencyMs}
              onChange={(e) => setThresholds((t) => ({ ...t, slowLatencyMs: Math.max(100, Number(e.target.value) || 100) }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
            >
              Restaurar padrões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Incident export toolbar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">Incidentes selecionados:</span>
            <Badge variant={incidentIds.size > 0 ? "default" : "outline"}>{incidentIds.size}</Badge>
            <Button type="button" variant="outline" size="sm" onClick={markAllVisible} disabled={filtered.length === 0}>
              Marcar visíveis
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearIncidents} disabled={incidentIds.size === 0}>
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "json")}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="sm" onClick={exportIncidents} disabled={incidentIds.size === 0}>
              Exportar incidentes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-36">Recebido</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="w-28">Ambiente</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24">Latência</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      <Clock className="mx-auto mb-2 h-5 w-5" />
                      Nenhum evento encontrado para os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => {
                    const retry = isLikelyRetry(e);
                    const isSecurity = e.status === "invalid_signature";
                    const isIncident = incidentIds.has(e.id);
                    return (
                    <TableRow
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={`cursor-pointer ${isIncident ? "bg-amber-50/60 hover:bg-amber-50" : isSecurity ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-muted/50"}`}
                    >
                      <TableCell onClick={(ev) => ev.stopPropagation()}>
                        <Checkbox
                          checked={isIncident}
                          onCheckedChange={(c) => toggleIncident(e.id, !!c)}
                          aria-label="Marcar como incidente"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(e.received_at), "dd/MM HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{e.event_type}</span>
                          {retry.retry && (
                            <Badge
                              variant="outline"
                              className={
                                retry.kind === "event_id_duplicate"
                                  ? "text-[10px] font-normal border-red-300 text-red-800 bg-red-50"
                                  : "text-[10px] font-normal border-amber-300 text-amber-800 bg-amber-50"
                              }
                              title={`${retry.reason} — ${retry.count}x`}
                            >
                              ↻ {retry.kind === "event_id_duplicate" ? "dup id" : "obj"} {retry.count}x
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.environment === "live" ? "default" : "secondary"} className="text-[10px]">
                          {e.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>{statusBadge(e.status)}</TableCell>
                      <TableCell>{latencyBadge(latencyMs(e), thresholds.slowLatencyMs)}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground space-y-0.5">
                        {e.stripe_customer_id && <div>cus: {e.stripe_customer_id}</div>}
                        {e.stripe_subscription_id && <div>sub: {e.stripe_subscription_id}</div>}
                        {e.user_id && <div>user: {e.user_id.slice(0, 8)}…</div>}
                        {!e.stripe_customer_id && !e.stripe_subscription_id && !e.user_id && <span>—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-red-700 max-w-md truncate">
                        {e.error_message || ""}
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5" />
        Logs persistidos via service_role na tabela <code className="font-mono">webhook_events</code>. RLS bloqueia acesso a não-admins.
      </div>

      {/* Event detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (() => {
            const ms = latencyMs(selected);
            const retry = isLikelyRetry(selected);
            const isSlow = ms !== null && ms >= thresholds.slowLatencyMs;
            const isSecurity = selected.status === "invalid_signature";
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 font-mono text-sm break-all">
                    {selected.event_type}
                  </SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
                    {statusBadge(selected.status)}
                    <Badge variant={selected.environment === "live" ? "default" : "secondary"} className="text-[10px]">
                      {selected.environment}
                    </Badge>
                    {isSlow && (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-[10px]">
                        latência alta
                      </Badge>
                    )}
                    {retry.retry && (
                      <Badge
                        variant="outline"
                        className={
                          retry.kind === "event_id_duplicate"
                            ? "text-[10px] border-red-300 text-red-800 bg-red-50"
                            : "text-[10px] border-amber-300 text-amber-800 bg-amber-50"
                        }
                      >
                        ↻ {retry.kind === "event_id_duplicate" ? "event_id duplicado" : "objeto repetido"} ({retry.count}x)
                      </Badge>
                    )}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4 text-sm">
                  {isSecurity && (
                    <div className="rounded-md border border-red-300 bg-red-50/70 p-2 text-xs text-red-900">
                      <div className="flex items-center gap-1.5 font-medium">
                        <ShieldAlert className="h-3.5 w-3.5" /> Risco de segurança
                      </div>
                      <div className="mt-0.5">
                        Assinatura inválida. Verifique se o segredo do webhook está correto e se a origem é legítima.
                      </div>
                    </div>
                  )}

                  <DetailRow label="Event ID" value={selected.event_id} mono />
                  <DetailRow label="Internal ID" value={selected.id} mono />
                  <Separator />
                  <DetailRow
                    label="Recebido em"
                    value={`${format(new Date(selected.received_at), "dd/MM/yyyy HH:mm:ss")} (${formatDistanceToNow(new Date(selected.received_at), { addSuffix: true, locale: ptBR })})`}
                  />
                  <DetailRow
                    label="Processado em"
                    value={selected.processed_at ? format(new Date(selected.processed_at), "dd/MM/yyyy HH:mm:ss") : "—"}
                  />
                  <DetailRow
                    label="Latência"
                    value={
                      <span className={isSlow ? "text-amber-700 font-medium" : undefined}>
                        {formatLatency(ms)}
                        {isSlow && ` (≥ limite ${formatLatency(thresholds.slowLatencyMs)})`}
                      </span>
                    }
                  />
                  <Separator />
                  <DetailRow label="Customer" value={selected.stripe_customer_id} mono />
                  <DetailRow label="Subscription" value={selected.stripe_subscription_id} mono />
                  <DetailRow label="User ID" value={selected.user_id} mono />
                  {selected.error_message && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Erro</div>
                        <div className="rounded-md border border-red-200 bg-red-50/60 p-2 text-xs text-red-800 whitespace-pre-wrap break-words">
                          {selected.error_message}
                        </div>
                      </div>
                    </>
                  )}
                  {retry.retry && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Heurística de retentativa</div>
                        <div className="text-xs space-y-1">
                          <div>
                            Categoria:{" "}
                            <strong>
                              {retry.kind === "event_id_duplicate"
                                ? "event_id duplicado (alta confiança)"
                                : "mesmo (event_type + objeto) (média confiança)"}
                            </strong>
                          </div>
                          <div>Ocorrências: <strong>{retry.count}</strong></div>
                          <div className="text-muted-foreground">{retry.detail}</div>
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-muted-foreground">Incidente</div>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={incidentIds.has(selected.id)}
                          onCheckedChange={(c) => toggleIncident(selected.id, !!c)}
                        />
                        Marcar como incidente
                      </label>
                    </div>
                    <Textarea
                      placeholder="Nota do operador (opcional) — incluída na exportação"
                      value={incidentNotes[selected.id] ?? ""}
                      onChange={(ev) =>
                        setIncidentNotes((prev) => ({ ...prev, [selected.id]: ev.target.value }))
                      }
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  {selected.payload_summary && Object.keys(selected.payload_summary).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Payload (resumo)</div>
                        <pre className="rounded-md border bg-muted/50 p-2 text-[11px] overflow-x-auto">
                          {JSON.stringify(selected.payload_summary, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={`col-span-2 text-xs break-all ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
