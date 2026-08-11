import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AssistantPanel } from "@/components/assistant/AssistantPanel"
import { Sidebar } from "@/components/shell/Sidebar"
import { TopBar } from "@/components/shell/TopBar"

export interface PageTitleContext {
  setTitle: (title: string) => void
}

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
            <AssistantPanel
              pageTitle={title}
              onClose={() => setAssistantOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
