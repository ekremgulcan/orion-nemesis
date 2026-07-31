import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Maps the domain status vocabulary (BEKLEMEDE/TAMAMLANDI/IPTAL/...) to
 * the success/danger/warning/info color tokens defined in index.css, per
 * the orion-screen-migration design system. Always shows the literal
 * Turkish status text alongside the color - never color-only.
 */
function statusToneClasses(durum: string): string {
  const upper = durum.toUpperCase()
  if (upper === "TAMAMLANDI" || upper === "ONAYLANDI") {
    return "bg-success-muted text-success border-success/30"
  }
  if (upper === "IPTAL" || upper === "REDDEDILDI" || upper === "HATA" || upper === "TAKAS_HATALI" || upper === "PROBLEM") {
    return "bg-danger-muted text-danger border-danger/30"
  }
  if (upper === "BEKLEMEDE" || upper === "REVIZYONDA" || upper === "HAVUZDA") {
    return "bg-warning-muted text-warning border-warning/30"
  }
  return "bg-info-muted text-info border-info/30"
}

export function StatusBadge({ durum, className }: { durum: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusToneClasses(durum), "font-medium", className)}>
      {durum}
    </Badge>
  )
}
