import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AssistantPanel } from "@/components/assistant/AssistantPanel"
import { ResizeHandle } from "@/components/layout/ResizeHandle"
import { Sidebar } from "@/components/shell/Sidebar"
import { TopBar } from "@/components/shell/TopBar"
import { useResizableWidth } from "@/hooks/useResizableWidth"

export interface PageTitleContext {
  setTitle: (title: string) => void
}

const ASSISTANT_WIDTH_KEY = "orion-assistant-width-v1"

/**
 * Persistent global shell: top bar + left nav (Sidebar) + a content area
 * rendered by React Router's <Outlet/>. Each page owns the mandatory
 * 3-column body (middle table + right detail panel) and reports its
 * title up to the shared top bar via the Outlet context - see
 * orion-screen-migration skill's design-system.md.
 */
export function AppShell() {
  const [title, setTitle] = useState("Orion v3 Nemesis")
  const [assistantOpen, setAssistantOpen] = useState(false)
  const { width: assistantWidth, onResizeStart } = useResizableWidth({
    defaultWidth: 360,
    minWidth: 280,
    maxWidth: 560,
    storageKey: ASSISTANT_WIDTH_KEY,
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => setAssistantOpen((o) => !o)}
        />
        <div className="flex min-h-0 flex-1">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Outlet context={{ setTitle } satisfies PageTitleContext} />
          </main>
          {assistantOpen && (
            <div
              style={{ width: assistantWidth }}
              className="relative flex shrink-0 flex-col border-l border-border"
            >
              <ResizeHandle onMouseDown={onResizeStart} />
              <AssistantPanel
                pageTitle={title}
                onClose={() => setAssistantOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
