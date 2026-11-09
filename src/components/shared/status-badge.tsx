import { cn } from "@/lib/utils";
import { statusConfigByKind, toneClasses, type StatusKind } from "@/lib/status";

type StatusOf<K extends StatusKind> = keyof (typeof statusConfigByKind)[K];

interface StatusBadgeProps<K extends StatusKind> {
  kind: K;
  status: StatusOf<K>;
  /** Overrides the default label. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge<K extends StatusKind>({
  kind,
  status,
  label,
  size = "md",
  className,
}: StatusBadgeProps<K>) {
  const config = (statusConfigByKind[kind] as Record<string, { label: string; tone: keyof typeof toneClasses; pulse?: boolean }>)[
    status as string
  ];
  const tone = toneClasses[config.tone];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        tone.soft,
        className,
      )}
    >
      <span className="relative flex size-1.5" aria-hidden>
        {config.pulse && (
          <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", tone.dot)} />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", tone.dot)} />
      </span>
      {label ?? config.label}
    </span>
  );
}
