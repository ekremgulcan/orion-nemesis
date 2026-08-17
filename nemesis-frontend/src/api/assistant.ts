import { apiClient } from "@/api/client"

export type AssistantMode = "advisor" | "executor"

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

export interface PendingAction {
  actionId: string
  tool: string
  summary: string
  args: Record<string, unknown>
}

export interface AssistantQueryResponse {
  answer: string
  mockMode: boolean
  provider: string
  assistantMode?: string
  toolCalls: ToolCallRecord[]
  suggestedFollowUps: string[]
  pendingAction?: PendingAction | null
}

export interface AssistantConfirmResponse {
  executed: boolean
  message: string
  tool?: string
  success: boolean
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
  mode: AssistantMode
  context: AssistantContext
  history: AssistantHistoryMessage[]
}): Promise<AssistantQueryResponse> {
  const { data } = await apiClient.post<AssistantQueryResponse>("/assistant/query", body)
  return data
}

export async function confirmAssistantAction(body: {
  actionId: string
  confirmed: boolean
}): Promise<AssistantConfirmResponse> {
  const { data } = await apiClient.post<AssistantConfirmResponse>("/assistant/confirm", body)
  return data
}
