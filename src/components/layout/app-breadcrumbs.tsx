"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { segmentLabels } from "@/lib/navigation";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";

/** Breadcrumbs derived from the URL; ids are resolved to entity names. */
export function AppBreadcrumbs() {
  const pathname = usePathname();
  const automations = useAutomationStore((s) => s.automations);
  const executions = useExecutionStore((s) => s.executions);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label =
      segmentLabels[segment] ??
      automations.find((a) => a.id === segment)?.name ??
      (executions.some((e) => e.id === segment) ? `Ejecución ${segment.slice(-6)}` : decodeURIComponent(segment));
    return { href, label };
  });

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={last ? "min-w-0" : "hidden sm:inline-flex"}>
                {last ? (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="whitespace-nowrap">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
