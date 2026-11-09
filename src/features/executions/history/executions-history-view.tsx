"use client";

import { CircleCheck, CircleX, Clock, History } from "lucide-react";
import { useMemo, useState } from "react";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecentExecutionsTable } from "@/features/dashboard/recent-executions-table";
import { formatDuration, formatNumber, formatPercent } from "@/lib/format";
import { successRate } from "@/lib/metrics";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";

const ALL = "all";
const periods = [
  { value: "1", label: "Hoy" },
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: ALL, label: "Todo el historial" },
];

export function ExecutionsHistoryView() {
  const executions = useExecutionStore((s) => s.executions);
  const executionsReady = useExecutionStore((s) => s.status === "ready");
  const automations = useAutomationStore((s) => s.automations);
  const users = useSessionStore((s) => s.users);
  const [bot, setBot] = useState(ALL);
  const [engine, setEngine] = useState(ALL);
  const [period, setPeriod] = useState("30");

  const filtered = useMemo(() => {
    const from = period === ALL ? 0 : (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime() - (Number(period) - 1) * 86_400_000;
    })();
    return executions.filter(
      (e) =>
        (bot === ALL || e.automationId === bot) &&
        (engine === ALL || (engine === "local" ? e.engine === "local" : e.engine !== "local")) &&
        new Date(e.startedAt).getTime() >= from,
    );
  }, [executions, bot, engine, period]);

  const finished = filtered.filter((e) => e.durationMs !== undefined && e.status !== "running");
  const average = finished.length ? finished.reduce((s, e) => s + (e.durationMs ?? 0), 0) / finished.length : undefined;
  const loading = !executionsReady;

  const filters = (
    <>
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger size="sm" className="w-40" aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={bot} onValueChange={setBot}>
        <SelectTrigger size="sm" className="w-52" aria-label="Automatización">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las automatizaciones</SelectItem>
          {automations.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={engine} onValueChange={setEngine}>
        <SelectTrigger size="sm" className="w-36" aria-label="Motor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Ambos motores</SelectItem>
          <SelectItem value="simulated">Simulado</SelectItem>
          <SelectItem value="local">Real (Chrome)</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Historial de ejecuciones" description="Todas las ejecuciones de los bots, simuladas y reales, con su resultado y detalle." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ejecuciones" value={formatNumber(filtered.length)} icon={History} tone="neutral" loading={loading} />
        <MetricCard label="Tasa de éxito" value={filtered.length ? formatPercent(successRate(filtered)) : "—"} icon={CircleCheck} tone="success" loading={loading} />
        <MetricCard label="Fallidas" value={filtered.filter((e) => e.status === "failed").length} icon={CircleX} tone="destructive" loading={loading} />
        <MetricCard label="Duración promedio" value={formatDuration(average)} icon={Clock} tone="teal" loading={loading} />
      </div>
      <RecentExecutionsTable
        executions={filtered}
        users={users}
        loading={loading}
        title="Ejecuciones"
        description={`${formatNumber(filtered.length)} resultados`}
        pageSize={15}
        showViewAll={false}
        toolbar={filters}
        emptyFilteredMessage={executions.length > 0 ? "No hay ejecuciones con estos filtros" : undefined}
      />
    </div>
  );
}
