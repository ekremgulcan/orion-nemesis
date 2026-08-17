import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Bot, RefreshCw } from "lucide-react"
import { toast } from "sonner"
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
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries()
      toast.success("Ekran verileri yenilendi")
    } catch {
      toast.error("Yenileme başarısız")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="gap-2"
          title="Bu ekranın verilerini yenile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
        <Button
          variant={assistantOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleAssistant}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          Danışman
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-medium text-accent">
          OK
        </div>
      </div>
    </header>
  )
}
