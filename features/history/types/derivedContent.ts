export type DerivedContentType =
  | 'MEETING_MINUTES'
  | 'TASK_LIST'
  | 'CLIENT_EMAIL'
  | 'WHATSAPP_MESSAGE'
  | 'LINKEDIN_POST'
  | 'VIDEO_SCRIPT'
  | 'FAQ'

export interface DerivedContentData {
  id: string
  transcriptionId: string
  type: DerivedContentType
  title: string
  content: string
  tokensUsed: number
  modelUsed: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface DerivedContentTypeInfo {
  type: DerivedContentType
  label: string
  icon: string
  description: string
}

export const DERIVED_CONTENT_TYPES: DerivedContentTypeInfo[] = [
  {
    type: 'MEETING_MINUTES',
    label: 'Ata de reunião',
    icon: 'assignment',
    description: 'Gera uma ata estruturada com tópicos discutidos, decisões tomadas e próximos passos identificados na conversa',
  },
  {
    type: 'TASK_LIST',
    label: 'Lista de tarefas',
    icon: 'checklist',
    description: 'Extrai todas as tarefas e pendências mencionadas, com responsáveis e prazos quando identificados',
  },
  {
    type: 'CLIENT_EMAIL',
    label: 'E-mail para cliente',
    icon: 'mail',
    description: 'Cria um e-mail profissional de follow-up com recap da conversa e próximos passos',
  },
  {
    type: 'WHATSAPP_MESSAGE',
    label: 'WhatsApp',
    icon: 'chat',
    description: 'Gera uma mensagem curta e objetiva resumindo os pontos principais em 2-4 frases',
  },
  {
    type: 'LINKEDIN_POST',
    label: 'Post LinkedIn',
    icon: 'share',
    description: 'Cria um post profissional com insights, storytelling e hashtags relevantes',
  },
  {
    type: 'VIDEO_SCRIPT',
    label: 'Roteiro de vídeo',
    icon: 'videocam',
    description: 'Gera um roteiro para Reels/Shorts com gancho, desenvolvimento e call-to-action',
  },
  {
    type: 'FAQ',
    label: 'FAQ',
    icon: 'quiz',
    description: 'Extrai as principais perguntas e respostas identificadas na conversa',
  },
]
