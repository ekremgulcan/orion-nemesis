import { Bot, Loader2, Send, Sparkles, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  confirmAssistantAction,
  fetchAssistantStatus,
  postAssistantQuery,
  type AssistantMode,
  type AssistantStatus,
  type PendingAction,
} from "@/api/assistant"
import { extractErrorMessage } from "@/api/client"
import { useAssistantChat } from "@/hooks/useAssistantChat"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const DEFAULT_SUGGESTIONS = [
  "Kullanıcı yetkisini nasıl düzenlerim?",
  "Bekleyen teminat transferleri var mı?",
]

const MODE_STORAGE_KEY = "orion-assistant-mode-v1"

function loadMode(): AssistantMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY)
    return raw === "executor" ? "executor" : "advisor"
  } catch {
    return "advisor"
  }
}

interface AssistantPanelProps {
  pageTitle: string
  onClose: () => void
}

export function AssistantPanel({ pageTitle, onClose }: AssistantPanelProps) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { messages, appendMessage, clearMessages } = useAssistantChat()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<AssistantStatus | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [assistantMode, setAssistantMode] = useState<AssistantMode>(loadMode)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAssistantStatus().then(setStatus).catch(() => null)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, assistantMode)
    } catch {
      /* ignore */
    }
  }, [assistantMode])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, pendingAction])

  function setMode(next: AssistantMode) {
    setAssistantMode(next)
    setPendingAction(null)
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || confirming) return

    setError(null)
    setPendingAction(null)
    setLoading(true)
    const userMsg = { role: "user" as const, content: trimmed }
    const historyForApi = messages
    appendMessage(userMsg)
    setInput("")

    try {
      const response = await postAssistantQuery({
        message: trimmed,
        mode: assistantMode,
        context: {
          pathname: location.pathname,
          pageTitle,
        },
        history: historyForApi,
      })
      appendMessage({ role: "assistant", content: response.answer })
      if (response.pendingAction) {
        setPendingAction(response.pendingAction)
      }
      if (response.suggestedFollowUps?.length) {
        setSuggestions(response.suggestedFollowUps)
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Asistan yanıt veremedi."))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(confirmed: boolean) {
    if (!pendingAction || confirming) return
    setConfirming(true)
    setError(null)
    try {
      const result = await confirmAssistantAction({
        actionId: pendingAction.actionId,
        confirmed,
      })
      setPendingAction(null)
      appendMessage({ role: "assistant", content: result.message })
      if (result.executed && result.success) {
        await queryClient.invalidateQueries()
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Onay işlemi başarısız."))
    } finally {
      setConfirming(false)
    }
  }

  const providerLabel = status?.geminiConfigured ? "Gemini" : "Mock"
  const modeHint =
    assistantMode === "executor"
      ? "Yürütücü · yazma onay kartı ile"
      : "Danışman · salt rehberlik"

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <div>
            <p className="text-sm font-semibold">Operasyon Asistanı</p>
            <p className="text-[10px] text-muted-foreground">
              {providerLabel} · {modeHint}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Sohbeti temizle"
            onClick={() => {
              clearMessages()
              setPendingAction(null)
              setSuggestions(DEFAULT_SUGGESTIONS)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-border px-4 py-2">
        <button
          type="button"
          onClick={() => setMode("advisor")}
          className={
            assistantMode === "advisor"
              ? "flex-1 rounded-md bg-accent-muted px-2 py-1.5 text-xs font-medium text-foreground"
              : "flex-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-card"
          }
        >
          Danışman
        </button>
        <button
          type="button"
          onClick={() => setMode("executor")}
          className={
            assistantMode === "executor"
              ? "flex-1 rounded-md bg-accent-muted px-2 py-1.5 text-xs font-medium text-foreground"
              : "flex-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-card"
          }
        >
          Yürütücü
        </button>
      </div>

      {assistantMode === "executor" && (
        <p className="border-b border-border bg-card px-4 py-1.5 text-[11px] text-muted-foreground">
          Yazma işlemleri (teminat onay/iptal, nakit onay/red) onayınızla çalışır.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="font-medium">Nasıl yardımcı olabilirim?</span>
            </div>
            <p>
              {assistantMode === "executor"
                ? "Yürütücü moddasınız: teminat/nakit yazma işlemlerini önerebilirim; onay kartından uygularsınız."
                : "Danışman mod: hangi ekrana gitmeniz ve hangi butona basmanız gerektiğini anlatırım. Kayıt değiştirmek için Yürütücü moda geçin."}
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

        {pendingAction && (
          <div className="mr-2 rounded-lg border border-accent/40 bg-accent-muted/40 px-3 py-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Onay bekleyen işlem
            </p>
            <p className="mb-3 text-foreground">{pendingAction.summary}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={confirming}
                onClick={() => void handleConfirm(true)}
              >
                {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Onayla"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={confirming}
                onClick={() => void handleConfirm(false)}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Düşünüyor...
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
              disabled={loading || confirming}
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
            placeholder={
              assistantMode === "executor"
                ? "Örnek: BEKLEMEDE teminat #3'ü onayla"
                : "Örnek: Kullanıcı yetkisini nasıl düzenlerim?"
            }
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
            disabled={loading || confirming || !input.trim()}
            onClick={() => void sendMessage(input)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
