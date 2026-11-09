"use client";

import { useCallback, useEffect, useState } from "react";

import { maintenanceService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { SelectorIssue } from "@/types";

/** Issues of one automation plus the repair actions. */
export function useMaintenance(automationId: string) {
  const [issues, setIssues] = useState<SelectorIssue[] | null>(null);
  const upsert = useAutomationStore((s) => s.upsert);

  const reload = useCallback(async () => {
    setIssues(await maintenanceService.listIssues(automationId));
  }, [automationId]);

  useEffect(() => {
    let alive = true;
    void maintenanceService.listIssues(automationId).then((list) => alive && setIssues(list));
    return () => {
      alive = false;
    };
  }, [automationId]);

  const applyFix = useCallback(
    async (issueId: string, selector: string) => {
      const { issue, automation } = await maintenanceService.applyFix(issueId, selector);
      upsert(automation);
      setIssues((list) => list?.map((i) => (i.id === issue.id ? issue : i)) ?? null);
      return issue;
    },
    [upsert],
  );

  return {
    issues,
    open: issues?.filter((i) => i.status === "open") ?? [],
    reload,
    applyFix,
    testSelector: maintenanceService.testSelector,
  };
}
