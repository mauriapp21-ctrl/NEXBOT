"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";

import { ExecutionsChart, SuccessRateChart, TimeSavedChart, TopBotsChart } from "./dashboard-charts";
import { DashboardMetrics } from "./dashboard-metrics";
import { RecentExecutionsTable } from "./recent-executions-table";
import { useDashboardData } from "./use-dashboard-data";

export function DashboardView() {
  const automations = useAutomationStore((s) => s.automations);
  const executions = useExecutionStore((s) => s.executions);
  const users = useSessionStore((s) => s.users);
  const currentUser = useSessionStore((s) => s.currentUser);
  const automationsReady = useAutomationStore((s) => s.status === "ready");
  const executionsReady = useExecutionStore((s) => s.status === "ready");
  const loading = !automationsReady || !executionsReady;
  const data = useDashboardData(automations, executions);

  const firstName = currentUser?.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Dashboard"}
        description={`Resumen de la operación automatizada · ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}`}
      />
      <DashboardMetrics data={data} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <ExecutionsChart data={data} loading={loading} />
        <SuccessRateChart data={data} loading={loading} />
        <TopBotsChart data={data} loading={loading} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentExecutionsTable executions={executions} users={users} loading={loading} />
        </div>
        <TimeSavedChart data={data} loading={loading} />
      </div>
    </div>
  );
}
