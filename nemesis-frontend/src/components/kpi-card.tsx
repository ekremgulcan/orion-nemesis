import { cn } from "@/lib/utils"

/**
 * Compact stat card for KPI strips above data tables - see
 * orion-screen-migration skill's data-visualization.md. Values are
 * always derived from data the table/DTO already has (client-side
 * useMemo), never a separate fabricated metric.
 */
export function KpiCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "danger" | "warning" | "info"
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-xl font-semibold tnum",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "info" && "text-info",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  )
}
