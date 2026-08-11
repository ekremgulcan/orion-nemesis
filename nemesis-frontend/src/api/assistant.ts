import { apiClient } from "@/api/client"

export interface AssistantContext {
  pathname: string
  pageTitle: string
  selectedEntityType?: string
  selectedEntityId?: number
}

export interface AssistantHistoryMessage {
  role: "user" | "assistant"
  content: string
}

export interface ToolCallRecord {
  tool: string
  input: Record<string, unknown>
  recordCount: number
}

export interface AssistantQueryResponse {
  answer: string
  mockMode: boolean
  provider: string
  toolCalls: ToolCallRecord[]
  suggestedFollowUps: string[]
}

export interface AssistantStatus {
  enabled: boolean
  geminiConfigured: boolean
  model: string
  mode: string
}

export async function fetchAssistantStatus(): Promise<AssistantStatus> {
  const { data } = await apiClient.get<AssistantStatus>("/assistant/status")
  return data
}

export async function postAssistantQuery(body: {
  message: string
  context: AssistantContext
  history: AssistantHistoryMessage[]
}): Promise<AssistantQueryResponse> {
  const { data } = await apiClient.post<AssistantQueryResponse>("/assistant/query", body)
  return data
}
