import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { ResizeHandle } from "@/components/layout/ResizeHandle"
import { Button } from "@/components/ui/button"
import { useResizableWidth } from "@/hooks/useResizableWidth"
import { cn } from "@/lib/utils"

const DETAIL_WIDTH_KEY = "orion-detail-aside-width-v1"
const DETAIL_OPEN_KEY = "orion-detail-aside-open-v1"

function readOpen(key: string): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === "false") return false
    if (raw === "true") return true
    return true
  } catch {
    return true
  }
}

/**
 * Right-hand detail column used by list+detail screens.
 * Resizable when open; collapsible to give the table more space.
 */
export function DetailAside({
  children,
  className,
  storageKey = DETAIL_WIDTH_KEY,
  title = "Detay",
}: {
  children: ReactNode
  className?: string
  storageKey?: string
  title?: string
}) {
  const openKey = `${storageKey}-open`
  const [open, setOpen] = useState(() => readOpen(openKey))
  const { width, onResizeStart } = useResizableWidth({
    defaultWidth: 384,
    minWidth: 280,
    maxWidth: 720,
    storageKey,
  })

  useEffect(() => {
    try {
      localStorage.setItem(openKey, String(open))
    } catch {
      /* ignore */
    }
  }, [open, openKey])

  if (!open) {
    return (
      <aside
        className={cn(
          "hidden w-10 shrink-0 flex-col border-l border-border bg-surface lg:flex",
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="mt-2 mx-auto h-8 w-8"
          title={`${title} panelini aç`}
          onClick={() => setOpen(true)}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <span
          className="mx-auto mt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]"
          aria-hidden
        >
          {title}
        </span>
      </aside>
    )
  }

  return (
    <aside
      style={{ width }}
      className={cn(
        "relative hidden shrink-0 flex-col bg-surface lg:flex",
        className,
      )}
    >
      <ResizeHandle onMouseDown={onResizeStart} />
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-2 pl-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          title={`${title} panelini kapat`}
          onClick={() => setOpen(false)}
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  )
}

export { DETAIL_WIDTH_KEY, DETAIL_OPEN_KEY }
