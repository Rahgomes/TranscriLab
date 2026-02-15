import type { DerivedContentType } from '@prisma/client'

export interface PromptConfig {
  systemPrompt: string
  maxTokens: number
  temperature: number
  needsFullTranscription: boolean
  needsSegments: boolean
}

interface InputData {
  transcription: string
  summary?: string
  insights?: string[]
  segments?: Array<{ speaker: string; text: string; speakerLabel?: string }>
  fileName: string
}

const TRUNCATION_THRESHOLD = 8000

function truncateText(text: string): string {
  if (text.length <= TRUNCATION_THRESHOLD) return text
  const head = text.slice(0, 4000)
  const tail = text.slice(-2000)
  return `${head}\n\n[... texto truncado ...]\n\n${tail}`
}

function buildSegmentedText(
  segments: Array<{ speaker: string; text: string; speakerLabel?: string }>
): string {
  return segments
    .map((s) => `${s.speakerLabel || s.speaker}: ${s.text}`)
    .join('\n')
}

function buildInputWithSummary(data: InputData): string {
  const parts: string[] = []

  if (data.summary) {
    parts.push(`RESUMO EXISTENTE:\n${data.summary}`)
  }

  if (data.insights && data.insights.length > 0) {
    parts.push(`INSIGHTS:\n${data.insights.map((i) => `- ${i}`).join('\n')}`)
  }

  if (data.transcription.length <= 4000) {
    parts.push(`TRANSCRIÇÃO:\n${data.transcription}`)
  }

  return parts.join('\n\n---\n\n')
}

function buildInputSummaryOnly(data: InputData): string {
  const parts: string[] = []

  if (data.summary) {
    parts.push(`RESUMO:\n${data.summary}`)
  }

  if (data.insights && data.insights.length > 0) {
    parts.push(`INSIGHTS:\n${data.insights.map((i) => `- ${i}`).join('\n')}`)
  }

  if (!data.summary) {
    parts.push(`TRANSCRIÇÃO:\n${truncateText(data.transcription)}`)
  }

  return parts.join('\n\n---\n\n')
}

function buildInputFullTranscription(data: InputData): string {
  if (data.segments && data.segments.length > 0) {
    return truncateText(buildSegmentedText(data.segments))
  }
  return truncateText(data.transcription)
}

export function getInput(type: DerivedContentType, data: InputData): string {
  switch (type) {
    case 'TASK_LIST':
    case 'CLIENT_EMAIL':
      return buildInputWithSummary(data)

    case 'WHATSAPP_MESSAGE':
    case 'LINKEDIN_POST':
    case 'VIDEO_SCRIPT':
      return buildInputSummaryOnly(data)

    case 'MEETING_MINUTES':
    case 'FAQ':
      return buildInputFullTranscription(data)

    default:
      return buildInputWithSummary(data)
  }
}

export function getTitle(type: DerivedContentType, fileName: string): string {
  const labels: Record<DerivedContentType, string> = {
    MEETING_MINUTES: 'Ata de reunião',
    TASK_LIST: 'Lista de tarefas',
    CLIENT_EMAIL: 'E-mail para o cliente',
    WHATSAPP_MESSAGE: 'Mensagem de WhatsApp',
    LINKEDIN_POST: 'Post para LinkedIn',
    VIDEO_SCRIPT: 'Roteiro de vídeo',
    FAQ: 'FAQ',
  }

  const label = labels[type] || type
  const cleanName = fileName.replace(/\.[^/.]+$/, '')
  return `${label} — ${cleanName}`
}

export const PROMPT_CONFIGS: Record<DerivedContentType, PromptConfig> = {
  MEETING_MINUTES: {
    systemPrompt: `Você é um assistente especializado em criar atas de reunião.
Com base na transcrição fornecida, gere uma ata estruturada com:
- Participantes (identificados pelos falantes)
- Tópicos discutidos
- Decisões tomadas
- Ações e próximos passos (com responsável, se identificável)
Tom: formal, objetivo, terceira pessoa.
Responda APENAS com JSON válido: { "content": "texto da ata formatado em markdown" }`,
    maxTokens: 1200,
    temperature: 0.3,
    needsFullTranscription: true,
    needsSegments: true,
  },

  TASK_LIST: {
    systemPrompt: `Você é um assistente especializado em extrair tarefas e compromissos de conversas.
Com base no texto fornecido, identifique todas as tarefas, pendências e ações mencionadas.
Formato: lista com "- [ ] O quê — por quem — prazo (se mencionado)"
Tom: direto, imperativo.
Responda APENAS com JSON válido:
{
  "content": "texto da lista formatado em markdown",
  "metadata": { "tasks": [{ "task": "descrição", "assignee": "quem" ou null, "deadline": "prazo" ou null }] }
}`,
    maxTokens: 800,
    temperature: 0.3,
    needsFullTranscription: false,
    needsSegments: false,
  },

  CLIENT_EMAIL: {
    systemPrompt: `Você é um assistente especializado em redigir e-mails profissionais.
Com base no texto fornecido, gere um e-mail de follow-up para o cliente.
Estrutura: saudação, recap breve da conversa, próximos passos, encerramento cordial.
Tom: profissional, cordial e objetivo.
Responda APENAS com JSON válido: { "content": "texto do e-mail" }`,
    maxTokens: 800,
    temperature: 0.4,
    needsFullTranscription: false,
    needsSegments: false,
  },

  WHATSAPP_MESSAGE: {
    systemPrompt: `Você é um assistente especializado em criar mensagens curtas e objetivas.
Com base no texto fornecido, gere uma mensagem de WhatsApp em 2-4 frases.
Máximo de 500 caracteres. Sem formalidades excessivas.
Tom: amigável, objetivo e conciso.
Responda APENAS com JSON válido: { "content": "texto da mensagem" }`,
    maxTokens: 200,
    temperature: 0.4,
    needsFullTranscription: false,
    needsSegments: false,
  },

  LINKEDIN_POST: {
    systemPrompt: `Você é um assistente especializado em criar posts para LinkedIn.
Com base no texto fornecido, gere um post profissional com:
- Gancho de abertura (primeira frase que chame atenção)
- 2-3 parágrafos curtos com insights
- Call to action
- 3-5 hashtags relevantes
Tom: profissional mas acessível, com storytelling.
Responda APENAS com JSON válido: { "content": "texto do post" }`,
    maxTokens: 600,
    temperature: 0.5,
    needsFullTranscription: false,
    needsSegments: false,
  },

  VIDEO_SCRIPT: {
    systemPrompt: `Você é um assistente especializado em criar roteiros para vídeos curtos (Reels/TikTok/Shorts).
Com base no texto fornecido, gere um roteiro com:
- Gancho (primeiros 3 segundos)
- Desenvolvimento em bullet points
- CTA final
Tom: dinâmico, direto e engajante.
Responda APENAS com JSON válido: { "content": "texto do roteiro formatado em markdown" }`,
    maxTokens: 600,
    temperature: 0.5,
    needsFullTranscription: false,
    needsSegments: false,
  },

  FAQ: {
    systemPrompt: `Você é um assistente especializado em extrair perguntas e respostas de conversas.
Com base na transcrição fornecida, identifique as principais perguntas feitas e suas respostas.
Formato: "**P:** pergunta\n**R:** resposta"
Tom: claro e didático.
Responda APENAS com JSON válido:
{
  "content": "texto do FAQ formatado em markdown",
  "metadata": { "items": [{ "question": "pergunta", "answer": "resposta" }] }
}`,
    maxTokens: 800,
    temperature: 0.3,
    needsFullTranscription: true,
    needsSegments: false,
  },
}

export const DERIVED_CONTENT_LABELS: Record<DerivedContentType, string> = {
  MEETING_MINUTES: 'Ata de reunião',
  TASK_LIST: 'Lista de tarefas',
  CLIENT_EMAIL: 'E-mail para o cliente',
  WHATSAPP_MESSAGE: 'Mensagem de WhatsApp',
  LINKEDIN_POST: 'Post para LinkedIn',
  VIDEO_SCRIPT: 'Roteiro de vídeo',
  FAQ: 'FAQ',
}
