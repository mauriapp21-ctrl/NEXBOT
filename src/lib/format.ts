import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const toDate = (value: string | Date) =>
  typeof value === "string" ? parseISO(value) : value;

/** dd-MM-yyyy HH:mm, the canonical date format of the app. */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "dd-MM-yyyy HH:mm", { locale: es });
}

export function formatDate(value: string | Date): string {
  return format(toDate(value), "dd-MM-yyyy", { locale: es });
}

export function formatTime(value: string | Date, withSeconds = false): string {
  return format(toDate(value), withSeconds ? "HH:mm:ss" : "HH:mm", { locale: es });
}

/** "hace 5 minutos" */
export function formatRelative(value: string | Date): string {
  return `hace ${formatDistanceToNowStrict(toDate(value), { locale: es })}`;
}

/** 84_000 → "1 min 24 s"; 3_900_000 → "1 h 5 min". */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  if (minutes > 0) return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  return `${seconds} s`;
}

/** Elapsed clock for live timers: 00:04:12. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const numberFormatter = new Intl.NumberFormat("es-CL");
const percentFormatter = new Intl.NumberFormat("es-CL", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 0.934 → "93,4 %" */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}

/** Minutes → "12,5 h" or "45 min". */
export function formatHoursFromMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(hours)} h`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
