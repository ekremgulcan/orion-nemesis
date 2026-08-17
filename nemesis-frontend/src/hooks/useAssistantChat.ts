import { useCallback, useEffect, useState } from "react"
import type { AssistantHistoryMessage } from "@/api/assistant"

const STORAGE_KEY = "orion-assistant-chat-v1"

function saveMessages(next: AssistantHistoryMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-40)))
  } catch {
    /* ignore quota errors */
  }
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantHistoryMessage[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setMessages(JSON.parse(raw) as AssistantHistoryMessage[])
      }
    } catch {
      setMessages([])
    }
  }, [])

  const appendMessage = useCallback((msg: AssistantHistoryMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      saveMessages(next)
      return next
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    saveMessages([])
  }, [])

  return { messages, appendMessage, clearMessages }
}
