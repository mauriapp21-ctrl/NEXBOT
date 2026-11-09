"use client";

import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

import { successRate, timeSavedMinutes } from "@/lib/metrics";
import type { Automation, Execution } from "@/types";

const DAY_MS = 86_400_000;

function within(executions: Execution[], from: Date, to: Date) {
  return executions.filter((e) => {
    const t = new Date(e.startedAt).getTime();
    return t >= from.getTime() && t < to.getTime();
  });
}

/** All dashboard figures derived from automations and executions. */
export function useDashboardData(automations: Automation[], executions: Execution[]) {
  return useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today.getTime() + DAY_MS);
    const yesterday = subDays(today, 1);
    const weekStart = subDays(today, 6);
    const prevWeekStart = subDays(today, 13);

    const todayRuns = within(executions, today, tomorrow);
    const yesterdayRuns = within(executions, yesterday, today);
    const week = within(executions, weekStart, tomorrow);
    const prevWeek = within(executions, prevWeekStart, weekStart);
    const count = (list: Execution[], status: Execution["status"]) => list.filter((e) => e.status === status).length;

    const perDay = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const runs = executions.filter((e) => isSameDay(new Date(e.startedAt), day));
      return {
        day: format(day, "EEE d", { locale: es }),
        completed: count(runs, "completed"),
        warning: count(runs, "warning"),
        failed: count(runs, "failed") + count(runs, "stopped"),
      };
    });

    const finished = executions.filter((e) => e.status !== "running" && e.status !== "queued");
    const outcome = [
      { key: "completed", label: "Exitosas", value: count(finished, "completed") },
      { key: "warning", label: "Con advertencias", value: count(finished, "warning") },
      { key: "failed", label: "Fallidas", value: count(finished, "failed") + count(finished, "stopped") },
    ];

    const byBot = automations
      .map((a) => ({
        id: a.id,
        name: a.name,
        runs: executions.filter((e) => e.automationId === a.id).length,
        savedHours: timeSavedMinutes(a, executions) / 60,
      }));

    const topBots = [...byBot].filter((b) => b.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 5);
    const timeSaved = [...byBot].filter((b) => b.savedHours > 0).sort((a, b) => b.savedHours - a.savedHours).slice(0, 6);
    const totalSavedMinutes = byBot.reduce((sum, b) => sum + b.savedHours * 60, 0);

    return {
      registered: automations.length,
      active: automations.filter((a) => a.status === "active").length,
      needsAttention: automations.filter((a) => a.status === "error" || a.status === "maintenance").length,
      today: { total: todayRuns.length, yesterday: yesterdayRuns.length },
      week: {
        completed: count(week, "completed"),
        failed: count(week, "failed"),
        prevCompleted: count(prevWeek, "completed"),
        prevFailed: count(prevWeek, "failed"),
        rate: successRate(week),
      },
      perDay,
      outcome,
      overallRate: successRate(executions),
      topBots,
      timeSaved,
      totalSavedMinutes,
    };
  }, [automations, executions]);
}

export type DashboardData = ReturnType<typeof useDashboardData>;
