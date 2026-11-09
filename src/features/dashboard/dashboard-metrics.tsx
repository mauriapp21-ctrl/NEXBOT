import { Bot, CircleCheck, CircleX, Clock, Play, Zap } from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { formatHoursFromMinutes, formatNumber, formatPercent } from "@/lib/format";

import type { DashboardData } from "./use-dashboard-data";

function delta(current: number, previous: number) {
  const diff = current - previous;
  return {
    value: `${diff > 0 ? "+" : ""}${formatNumber(diff)}`,
    direction: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("flat" as const),
  };
}

export function DashboardMetrics({ data, loading }: { data: DashboardData; loading: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <MetricCard
        label="Bots registrados"
        value={data.registered}
        icon={Bot}
        tone="neutral"
        hint={data.needsAttention > 0 ? `${data.needsAttention} requieren atención` : "Todos operativos"}
        loading={loading}
      />
      <MetricCard
        label="Bots activos"
        value={data.active}
        icon={Zap}
        tone="primary"
        hint={`de ${data.registered} registrados`}
        loading={loading}
      />
      <MetricCard
        label="Ejecuciones del día"
        value={data.today.total}
        icon={Play}
        tone="teal"
        delta={{ ...delta(data.today.total, data.today.yesterday), label: "vs. ayer" }}
        trend={data.perDay.map((d) => d.completed + d.warning + d.failed)}
        loading={loading}
      />
      <MetricCard
        label="Exitosas (7 días)"
        value={data.week.completed}
        icon={CircleCheck}
        tone="success"
        delta={{ ...delta(data.week.completed, data.week.prevCompleted), label: "vs. semana anterior" }}
        hint={`Tasa ${formatPercent(data.week.rate)}`}
        loading={loading}
      />
      <MetricCard
        label="Fallidas (7 días)"
        value={data.week.failed}
        icon={CircleX}
        tone="destructive"
        delta={{
          ...delta(data.week.failed, data.week.prevFailed),
          positiveIsGood: false,
          label: "vs. semana anterior",
        }}
        trend={data.perDay.map((d) => d.failed)}
        loading={loading}
      />
      <MetricCard
        label="Tiempo ahorrado"
        value={formatHoursFromMinutes(data.totalSavedMinutes)}
        icon={Clock}
        tone="teal"
        hint="Últimos 30 días"
        loading={loading}
      />
    </div>
  );
}
