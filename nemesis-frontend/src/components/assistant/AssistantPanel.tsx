import { Bot, Loader2, Send, Sparkles, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import {
  fetchAssistantStatus,
  postAssistantQuery,
  type AssistantStatus,
} from "@/api/assistant"
import { extractErrorMessage } from "@/api/client"
import { useAssistantChat } from "@/hooks/useAssistantChat"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AssistantPanelProps {
  pageTitle: string
  onClose: () => void
}

export function AssistantPanel({ pageTitle, onClose }: AssistantPanelProps) {
  const location = useLocation()
  const { messages, appendMessage, clearMessages } = useAssistantChat()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<AssistantStatus | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([
    "Kullanici yetkisini nasil duzenlerim?",
    "Bekleyen teminat transferleri var mi?",
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAssistantStatus().then(setStatus).catch(() => null)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    setLoading(true)
    const userMsg = { role: "user" as const, content: trimmed }
    const historyForApi = messages
    appendMessage(userMsg)
    setInput("")

    try {
      const response = await postAssistantQuery({
        message: trimmed,
        context: {
          pathname: location.pathname,
          pageTitle,
        },
        history: historyForApi,
      })
      appendMessage({ role: "assistant", content: response.answer })
      if (response.suggestedFollowUps?.length) {
        setSuggestions(response.suggestedFollowUps)
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Asistan yanit veremedi."))
    } finally {
      setLoading(false)
    }
  }

  const modeLabel = status?.geminiConfigured ? "Gemini" : "Mock (danisman)"

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <div>
            <p className="text-sm font-semibold">Operasyon Danismani</p>
            <p className="text-[10px] text-muted-foreground">{modeLabel} · salt okuma</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Sohbeti temizle"
            onClick={() => {
              clearMessages()
              setSuggestions([
                "Kullanici yetkisini nasil duzenlerim?",
                "Bekleyen teminat transferleri var mi?",
              ])
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="font-medium">Nasil yardimci olabilirim?</span>
            </div>
            <p>
              Hangi ekrana gitmeniz, hangi butona basmaniz ve verinin hangi tabloda
              tutuldugunu anlatirim. Kayit degistirmem — sadece danismanlik.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg.role}`}
            className={
              msg.role === "user"
                ? "ml-6 rounded-lg bg-accent-muted px-3 py-2 text-sm text-foreground"
                : "mr-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground whitespace-pre-wrap"
            }
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Dusunuyor...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-danger-muted px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-2">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-left text-[11px] text-muted-foreground transition hover:border-accent hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ornek: Kullanici yetkisini nasil duzenlerim?"
            rows={2}
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendMessage(input)
              }
            }}
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            disabled={loading || !input.trim()}
            onClick={() => void sendMessage(input)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
