export interface SummaryData {
  summary: string
  insights: string[]
  tokensUsed: number
  generatedAt: Date
}

export interface SummarizeRequest {
  text: string
  maxTokens?: number
}

export interface SummarizeResponse {
  summary: string
  insights: string[]
  tokensUsed: number
}
