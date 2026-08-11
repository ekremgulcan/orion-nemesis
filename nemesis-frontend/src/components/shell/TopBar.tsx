import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopBar({
  title,
  assistantOpen,
  onToggleAssistant,
}: {
  title: string
  assistantOpen: boolean
  onToggleAssistant: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <Button
          variant={assistantOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleAssistant}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          Danisman
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-medium text-accent">
          OK
        </div>
      </div>
    </header>
  )
}
