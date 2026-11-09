"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber, formatPercent } from "@/lib/format";

import { ChartCard } from "./chart-card";
import type { DashboardData } from "./use-dashboard-data";

const outcomeConfig = {
  completed: { label: "Exitosas", color: "var(--success)" },
  warning: { label: "Con advertencias", color: "var(--warning)" },
  failed: { label: "Fallidas", color: "var(--destructive)" },
} satisfies ChartConfig;

export function ExecutionsChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  const total = data.perDay.reduce((sum, d) => sum + d.completed + d.warning + d.failed, 0);
  return (
    <ChartCard
      title="Ejecuciones de los últimos 7 días"
      description="Por resultado"
      loading={loading}
      aside={<span className="tabular text-sm font-semibold">{formatNumber(total)}</span>}
    >
      <ChartContainer config={outcomeConfig} className="aspect-auto h-60 w-full">
        <BarChart data={data.perDay} margin={{ left: -20, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" />
          <Bar dataKey="warning" stackId="a" fill="var(--color-warning)" />
          <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function SuccessRateChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  return (
    <ChartCard title="Tasa de éxito y error" description="Ejecuciones terminadas, 30 días" loading={loading}>
      <ChartContainer config={outcomeConfig} className="mx-auto aspect-square h-60">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie data={data.outcome} dataKey="value" nameKey="key" innerRadius="62%" strokeWidth={3} stroke="var(--card)">
            {data.outcome.map((entry) => (
              <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                      {formatPercent(data.overallRate)}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                      de éxito
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="key" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

const runsConfig = { runs: { label: "Ejecuciones", color: "var(--primary)" } } satisfies ChartConfig;
const savedConfig = { savedHours: { label: "Horas ahorradas", color: "var(--teal)" } } satisfies ChartConfig;

interface BotTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
  data: { id: string; name: string }[];
}

/** Y-axis label that links to the bot and truncates long names. */
function BotTick({ x, y, payload, data }: BotTickProps) {
  const name = String(payload?.value ?? "");
  const bot = data.find((b) => b.name === name);
  const label = name.length > 24 ? `${name.slice(0, 23)}…` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={bot ? `/automations/${bot.id}` : "/automations"}>
        <text x={-6} y={0} dy={4} textAnchor="end" className="fill-muted-foreground text-xs hover:fill-foreground">
          <title>{name}</title>
          {label}
        </text>
      </Link>
    </g>
  );
}

export function TopBotsChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  return (
    <ChartCard title="Bots más usados" description="Ejecuciones en 30 días" loading={loading}>
      <ChartContainer config={runsConfig} className="aspect-auto h-60 w-full">
        <BarChart data={data.topBots} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={186}
            tickLine={false}
            axisLine={false}
            tick={(props) => <BotTick {...props} data={data.topBots} />}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="runs" fill="var(--color-runs)" radius={4} barSize={18} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function TimeSavedChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  return (
    <ChartCard
      title="Tiempo ahorrado por proceso"
      description="(Duración manual − duración del bot) × ejecuciones exitosas"
      loading={loading}
    >
      <ChartContainer config={savedConfig} className="aspect-auto h-60 w-full">
        <BarChart data={data.timeSaved} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={186}
            tickLine={false}
            axisLine={false}
            tick={(props) => <BotTick {...props} data={data.timeSaved} />}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString("es-CL", { maximumFractionDigits: 1 })} h ahorradas`} />}
          />
          <Bar dataKey="savedHours" fill="var(--color-savedHours)" radius={4} barSize={18} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
