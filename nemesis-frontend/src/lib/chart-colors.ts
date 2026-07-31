/**
 * Chart color constants mirroring the CSS variables in index.css exactly
 * (see orion-screen-migration skill's data-visualization.md). Recharts
 * needs literal color strings at render time, so these are kept in sync
 * with index.css by hand - never let a chart fall back to recharts'
 * default rainbow palette.
 */
export const CHART_COLORS = {
  accent: "#d9a441",
  success: "#3ba55d",
  danger: "#d94f4f",
  warning: "#d9a441",
  info: "#4a90d9",
  muted: "#6b7a94",
  grid: "#26324a",
  surfaceElevated: "#16233d",
  foreground: "#e7ecf5",
  foregroundMuted: "#9aa7bd",
} as const

/**
 * Maps the domain status vocabulary to chart colors, mirroring
 * status-badge.tsx's tone mapping so a status always reads the same
 * color whether shown as a badge or a chart segment.
 */
export const STATUS_CHART_COLOR: Record<string, string> = {
  TAMAMLANDI: CHART_COLORS.success,
  ONAYLANDI: CHART_COLORS.success,
  IPTAL: CHART_COLORS.danger,
  REDDEDILDI: CHART_COLORS.danger,
  HATA: CHART_COLORS.danger,
  TAKAS_HATALI: CHART_COLORS.danger,
  PROBLEM: CHART_COLORS.danger,
  BEKLEMEDE: CHART_COLORS.warning,
  REVIZYONDA: CHART_COLORS.warning,
  HAVUZDA: CHART_COLORS.info,
}

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: CHART_COLORS.surfaceElevated,
    border: `1px solid ${CHART_COLORS.grid}`,
    borderRadius: 8,
    fontSize: 12,
  },
  itemStyle: { color: CHART_COLORS.foreground },
  labelStyle: { color: CHART_COLORS.foregroundMuted },
}
