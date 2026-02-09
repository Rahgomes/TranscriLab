Blueprint V2 - Transcritor de Áudio Avançado (com shadcn/ui + Tailwind)
📐 Arquitetura e Organização

1. Estrutura Feature-Based
   /app
   /api
   /transcribe
   route.ts
   types.ts
   /summarize
   route.ts
   types.ts
   page.tsx
   layout.tsx
   globals.css

/features
/transcription
/components
AudioUploader/
AudioUploader.tsx
constants.ts
types.ts
AudioFileList/
AudioFileList.tsx
AudioFileItem.tsx
types.ts
TranscriptionCard/
TranscriptionCard.tsx
types.ts
ProgressBar/
ProgressBar.tsx
types.ts
/hooks
useAudioUpload.ts
useTranscription.ts
useTranscriptionStorage.ts (opcional)
/utils
validation.ts
formatting.ts
/constants
index.ts
/types
index.ts

/summary
/components
SummaryPanel/
SummaryPanel.tsx
types.ts
InsightsDisplay/
InsightsDisplay.tsx
types.ts
/hooks
useSummary.ts
/types
index.ts
/constants
index.ts

/components
/ui (shadcn/ui components)
button.tsx
card.tsx
progress.tsx
toast.tsx
badge.tsx
separator.tsx
alert.tsx
skeleton.tsx

/lib
/openai
client.ts
types.ts
/constants
formats.ts
limits.ts
messages.ts
/types
global.ts
/utils
file.ts
api.ts
errors.ts
cn.ts (shadcn utility)
Regras:

Cada componente de feature tem sua própria pasta
types.ts e constants.ts ficam dentro da pasta do componente quando específicos
Tipos compartilhados vão em /types/index.ts da feature
Constantes compartilhadas vão em /constants/index.ts da feature
Componentes shadcn/ui ficam em /components/ui
🎨 Setup shadcn/ui + Tailwind 2. Instalação e Configuração
Dependências:

bash
Copiar

npx shadcn-ui@latest init
Componentes shadcn/ui necessários:

bash
Copiar

npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add skeleton
Configuração Tailwind (tailwind.config.ts):

typescript
Copiar

theme: {
extend: {
colors: {
background: 'hsl(0 0% 100%)',
foreground: 'hsl(0 0% 11.4%)',
card: 'hsl(0 0% 96.1%)',
'card-foreground': 'hsl(0 0% 11.4%)',
primary: 'hsl(0 0% 0%)',
'primary-foreground': 'hsl(0 0% 100%)',
secondary: 'hsl(0 0% 43.1%)',
'secondary-foreground': 'hsl(0 0% 100%)',
muted: 'hsl(0 0% 96.1%)',
'muted-foreground': 'hsl(0 0% 43.1%)',
accent: 'hsl(0 0% 96.1%)',
'accent-foreground': 'hsl(0 0% 11.4%)',
destructive: 'hsl(0 84.2% 60.2%)',
'destructive-foreground': 'hsl(0 0% 100%)',
border: 'hsl(0 0% 82.4%)',
success: 'hsl(142.1 76.2% 36.3%)',
},
borderRadius: {
lg: '12px',
md: '8px',
sm: '6px',
},
}
}
Paleta Apple-like:

Background: branco puro
Foreground: preto quase puro
Bordas: cinza claro
Accent: preto
Success: verde Apple
Destructive: vermelho Apple
🔧 Funcionalidades Core 3. Upload Múltiplo de Áudios
Objetivo: Permitir seleção e processamento de N arquivos simultaneamente

Componentes:

AudioUploader - área de drag & drop + input file
AudioFileList - lista de arquivos selecionados
AudioFileItem - card individual com status e progresso
Estados por arquivo:

typescript
Copiar

interface AudioFileState {
id: string
file: File
name: string
size: number
status: 'pending' | 'uploading' | 'transcribing' | 'completed' | 'error'
progress: number
transcription?: string
summary?: SummaryData
error?: string
createdAt: Date
}
Componentes shadcn/ui usados:

Card para AudioFileItem
Badge para status (pending, processing, completed, error)
Progress para barra de progresso
Button para ações (remover, retry)
Fluxo:

Usuário seleciona múltiplos arquivos (input ou drag & drop)
Validação client-side de cada arquivo (formato, tamanho)
Exibir lista com status "pending"
Processar sequencialmente (um por vez)
Atualizar progresso individual
Exibir resultado ou erro por arquivo
Validações:

Formato aceito (mp3, mp4, wav, webm, ogg, m4a)
Tamanho máximo 25MB
Arquivo não vazio
Estilo Tailwind para drag & drop:

typescript
Copiar

className={cn(
"border-2 border-dashed rounded-lg p-8 transition-colors",
"hover:border-primary hover:bg-accent/50",
isDragging && "border-primary bg-accent",
"flex flex-col items-center justify-center gap-4"
)} 4. Barra de Progresso com Porcentagem
Objetivo: Feedback visual detalhado durante processamento

Componente: ProgressBar

Props:

typescript
Copiar

interface ProgressBarProps {
progress: number // 0-100
fileName: string
status: 'uploading' | 'transcribing' | 'completed'
}
Componentes shadcn/ui usados:

Progress component do shadcn
Badge para status
Skeleton durante loading inicial
Lógica de progresso:

0-30%: Simulação durante upload do arquivo
30-100%: Durante chamada à API Whisper (simular incremento)
100%: Transcrição completa
Visual com Tailwind:

typescript
Copiar

<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">{fileName}</span>
    <Badge variant={statusVariant}>{status}</Badge>
  </div>
  <Progress value={progress} className="h-2" />
  <p className="text-xs text-muted-foreground">{progress}%</p>
</div>
Cores por status:

Uploading: default (preto)
Transcribing: default (preto)
Completed: success (verde)
Error: destructive (vermelho)
Implementação:

Usar hook useTranscription para gerenciar progresso
Atualizar estado a cada 100-200ms durante processamento
Transição suave via Tailwind 5. Resumo + Insights (Opcional)
Objetivo: Gerar resumo conciso e insights do texto transcrito

Componente: SummaryPanel

Componentes shadcn/ui usados:

Card para container do resumo
Button para "Gerar Resumo"
Badge para tokens utilizados
Separator entre resumo e insights
Alert para feedback de sucesso/erro
Skeleton durante loading
Fluxo:

Botão "Gerar Resumo" aparece após transcrição completa
Ao clicar, chama endpoint /api/summarize
Exibe Skeleton durante geração
Mostra resumo + insights em Card destacado
Exibe tokens utilizados em Badge
Endpoint /api/summarize:

Request:

typescript
Copiar

{
text: string
maxTokens?: number // default: 150
}
Response:

typescript
Copiar

{
summary: string
insights: string[]
tokensUsed: number
}
Otimizações de tokens:

Usar modelo gpt-4o-mini (mais barato)
Limitar max_tokens a 150
Temperature baixa (0.3) para respostas concisas
Prompt direto e estruturado
Sempre processar texto já transcrito (nunca reenviar áudio)
Prompt otimizado:

Analise o texto e forneça:

1. Resumo conciso (2-3 frases)
2. 3-5 insights principais

Texto:
[texto transcrito]

Formato:
RESUMO: [resumo aqui]
INSIGHTS:

- [insight 1]
- [insight 2]
- [insight 3]
  Visual com Tailwind:

typescript
Copiar

<Card className="mt-4">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg flex items-center gap-2">
        📝 Resumo
      </CardTitle>
      <Badge variant="secondary">{tokensUsed} tokens</Badge>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <p className="text-sm leading-relaxed">{summary}</p>

    <Separator />

    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        💡 Insights
      </h4>
      <ul className="space-y-1">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-muted-foreground flex gap-2">
            <span>•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>

  </CardContent>
</Card>
🧩 Hooks Customizados
6. useAudioUpload
Responsabilidade: Gerenciar estado de múltiplos arquivos

Retorno:

typescript
Copiar

interface UseAudioUploadReturn {
audioFiles: AudioFileState[]
addFiles: (files: File[]) => void
removeFile: (id: string) => void
processFiles: () => Promise<void>
clearAll: () => void
isProcessing: boolean
}
Lógica:

Adicionar arquivos validados à lista
Remover arquivo individual
Processar sequencialmente (um por vez)
Atualizar status e progresso de cada arquivo
Limpar todos os arquivos 7. useTranscription
Responsabilidade: Transcrever áudio individual e gerenciar progresso

Retorno:

typescript
Copiar

interface UseTranscriptionReturn {
transcribe: (file: File, onProgress: ProgressCallback) => Promise<TranscriptionResult>
progress: number
status: FileStatus
error: string | null
}
Lógica:

Enviar arquivo para /api/transcribe
Simular progresso durante upload (0-30%)
Simular progresso durante transcrição (30-100%)
Retornar texto transcrito
Tratar erros específicos 8. useSummary
Responsabilidade: Gerar resumo e insights

Retorno:

typescript
Copiar

interface UseSummaryReturn {
generateSummary: (text: string) => Promise<void>
summary: string | null
insights: string[]
isGenerating: boolean
tokensUsed: number
error: string | null
}
Lógica:

Chamar /api/summarize com texto
Gerenciar loading
Armazenar resultado
Tratar erros
📝 Tipagens 9. Tipos por Feature
/features/transcription/types/index.ts:

typescript
Copiar

export type FileStatus = 'pending' | 'uploading' | 'transcribing' | 'completed' | 'error'

export interface AudioFileState {
id: string
file: File
name: string
size: number
status: FileStatus
progress: number
transcription?: string
summary?: SummaryData
error?: string
createdAt: Date
}

export interface TranscriptionResult {
text: string
duration?: number
language?: string
}

export interface TranscriptionError {
message: string
code: string
retryable: boolean
}
/features/summary/types/index.ts:

typescript
Copiar

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
/lib/types/global.ts:

typescript
Copiar

export interface ApiResponse<T> {
data?: T
error?: string
}

export interface ProgressCallback {
(progress: number): void
}
🔒 Validações 10. Validação de Arquivos
Arquivo: /features/transcription/utils/validation.ts

Funções:

validateAudioFile(file: File): ValidationResult
validateAudioFiles(files: File[]): Map<string, ValidationResult>
Validações:

Formato aceito
Tamanho máximo (25MB)
Arquivo não vazio
Retorno:

typescript
Copiar

interface ValidationResult {
valid: boolean
error?: string
} 11. Formatação de Dados
Arquivo: /features/transcription/utils/formatting.ts

Funções:

formatFileSize(bytes: number): string → "2.5 MB"
formatDuration(seconds: number): string → "3:45"
truncateText(text: string, maxLength: number): string
🎨 Componentes shadcn/ui 12. Componentes Utilizados
Button:

Variantes: default, secondary, ghost, destructive, outline
Tamanhos: default, sm, lg, icon
Estados: default, hover, active, disabled
Uso: ações principais (upload, gerar resumo, copiar, remover)
Card:

Estrutura: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Uso: container de transcrição, resumo, file item
Progress:

Barra de progresso animada
Uso: progresso de upload/transcrição
Badge:

Variantes: default, secondary, destructive, outline, success (custom)
Uso: status de arquivo, tokens utilizados
Toast:

Sistema de notificações
Uso: feedback de ações (copiado, erro, sucesso)
Alert:

Variantes: default, destructive
Uso: mensagens de erro, avisos
Separator:

Divisor visual
Uso: separar seções dentro de cards
Skeleton:

Loading placeholder
Uso: loading de resumo, transcrição
🚨 Tratamento de Erros 13. Erros Específicos
Arquivo: /lib/utils/errors.ts

Classe customizada:

typescript
Copiar

export class TranscriptionError extends Error {
constructor(
message: string,
public code: string,
public retryable: boolean = true
) {
super(message)
this.name = 'TranscriptionError'
}
}
Cenários:

Arquivo muito grande → "Arquivo muito grande (máx: 25MB)"
Formato inválido → "Formato não suportado: audio/x-wav"
Rate limit → "Limite de requisições atingido. Aguarde alguns minutos."
Quota insuficiente → "Créditos insuficientes na API OpenAI."
Erro de rede → "Erro de conexão. Verifique sua internet."
Função helper:

typescript
Copiar

export function handleApiError(error: unknown): TranscriptionError
Exibição de erros:

Usar Alert component para erros não críticos
Usar toast para feedback rápido
Usar estado de erro inline no AudioFileItem
📊 Constantes 14. Constantes Organizadas
/lib/constants/limits.ts:

typescript
Copiar

export const MAX*FILE_SIZE_MB = 25
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 \_ 1024
export const MAX_CONCURRENT_UPLOADS = 1
export const SUMMARY_MAX_TOKENS = 150
export const SUMMARY_TEMPERATURE = 0.3
/lib/constants/formats.ts:

typescript
Copiar

export const ACCEPTED_AUDIO_FORMATS = [
'audio/mpeg',
'audio/mp4',
'audio/wav',
'audio/webm',
'audio/ogg',
'audio/x-m4a',
] as const

export const AUDIO_MIME_TO_EXTENSION: Record<string, string> = {
'audio/mpeg': '.mp3',
'audio/mp4': '.mp4',
'audio/wav': '.wav',
'audio/webm': '.webm',
'audio/ogg': '.ogg',
'audio/x-m4a': '.m4a',
}
/lib/constants/messages.ts:

typescript
Copiar

export const ERROR_MESSAGES = {
NO_FILE: 'Nenhum arquivo selecionado',
FILE_TOO_LARGE: 'Arquivo muito grande (máx: 25MB)',
INVALID_FORMAT: 'Formato de arquivo não suportado',
TRANSCRIPTION_FAILED: 'Erro ao transcrever áudio',
SUMMARY_FAILED: 'Erro ao gerar resumo',
NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
} as const

export const SUCCESS_MESSAGES = {
TRANSCRIPTION_COMPLETE: 'Transcrição concluída!',
SUMMARY_GENERATED: 'Resumo gerado com sucesso!',
COPIED_TO_CLIPBOARD: 'Copiado!',
} as const
🎯 Checklist de Implementação
Fase 1: Setup shadcn/ui + Tailwind
[ ] Instalar e configurar shadcn/ui
[ ] Configurar Tailwind com paleta Apple-like
[ ] Adicionar componentes shadcn necessários
[ ] Configurar tema (cores, bordas, espaçamentos)
[ ] Testar componentes básicos
Fase 2: Refatoração Arquitetural
[ ] Criar estrutura feature-based
[ ] Separar tipos em arquivos dedicados
[ ] Criar hooks customizados
[ ] Extrair validações para utils
[ ] Organizar constantes
Fase 3: Upload Múltiplo
[ ] Componente AudioUploader com drag & drop (Tailwind)
[ ] Componente AudioFileList
[ ] Componente AudioFileItem com Card + Badge + Progress
[ ] Hook useAudioUpload
[ ] Validação client-side
[ ] Processamento sequencial
Fase 4: Barra de Progresso
[ ] Componente ProgressBar usando shadcn Progress
[ ] Lógica de simulação de progresso (0-30%, 30-100%)
[ ] Hook useTranscription com callback de progresso
[ ] Badge para status
[ ] Skeleton durante loading
Fase 5: Resumo + Insights
[ ] Endpoint /api/summarize
[ ] Hook useSummary
[ ] Componente SummaryPanel com Card
[ ] Componente InsightsDisplay
[ ] Otimização de prompt
[ ] Badge para tokens utilizados
[ ] Separator entre seções
Fase 6: Sistema de Toasts
[ ] Configurar Toaster do shadcn
[ ] Toast para sucesso (transcrição completa)
[ ] Toast para sucesso (resumo gerado)
[ ] Toast para sucesso (copiado)
[ ] Toast para erros
Fase 7: Tratamento de Erros
[ ] Classe TranscriptionError
[ ] Função handleApiError
[ ] Alert component para erros
[ ] Mensagens específicas por erro
[ ] Botão de retry quando aplicável
Fase 8: Polimento UI/UX
[ ] Estado vazio com ilustração
[ ] Animações Tailwind (transition, hover)
[ ] Responsividade (sm, md, lg breakpoints)
[ ] Acessibilidade (aria-labels, focus-visible)
[ ] Micro-interações
[ ] Testes manuais
[ ] Ajustes finais
🎨 Design System (Apple-like com Tailwind)
Princípios:

Espaçamento generoso (Tailwind spacing scale)
Tipografia clara e hierárquica (font-medium, font-semibold)
Bordas suaves (rounded-lg, rounded-md)
Sombras sutis (shadow-sm, shadow-md)
Animações de 150-300ms (transition-all duration-200)
Cores neutras (preto, branco, cinza)
Minimalismo funcional
Tipografia Tailwind:

Títulos: text-2xl font-semibold
Subtítulos: text-lg font-medium
Corpo: text-sm
Caption: text-xs text-muted-foreground
Espaçamento Tailwind:

xs: space-y-1 / gap-1 (4px)
sm: space-y-2 / gap-2 (8px)
md: space-y-4 / gap-4 (16px)
lg: space-y-6 / gap-6 (24px)
xl: space-y-8 / gap-8 (32px)
Classes comuns:

typescript
Copiar

// Container principal
"min-h-screen bg-background p-8"

// Card de transcrição
"rounded-lg border bg-card shadow-sm"

// Área de drag & drop
"border-2 border-dashed rounded-lg p-8 transition-colors hover:border-primary hover:bg-accent/50"

// Botão primário
<Button className="w-full">Transcrever</Button>

// Badge de status
<Badge variant="default">Processando</Badge>
<Badge variant="secondary">{tokensUsed} tokens</Badge>
<Badge variant="destructive">Erro</Badge>

// Progress bar
<Progress value={progress} className="h-2" />

// Toast
toast({
title: "Sucesso!",
description: "Transcrição concluída",
})
🔧 Utility Functions 15. cn() helper (shadcn)
Arquivo: /lib/utils.ts

typescript
Copiar

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
return twMerge(clsx(inputs))
}
Uso:

typescript
Copiar

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
📦 Dependências
json
Copiar

{
"dependencies": {
"next": "^15.x",
"react": "^19.x",
"react-dom": "^19.x",
"openai": "^4.x",
"@radix-ui/react-progress": "^1.x",
"@radix-ui/react-toast": "^1.x",
"@radix-ui/react-separator": "^1.x",
"class-variance-authority": "^0.7.0",
"clsx": "^2.1.0",
"tailwind-merge": "^2.2.0",
"lucide-react": "^0.309.0"
},
"devDependencies": {
"@types/node": "^20.x",
"@types/react": "^19.x",
"@types/react-dom": "^19.x",
"typescript": "^5.x",
"tailwindcss": "^3.4.0",
"postcss": "^8.4.0",
"autoprefixer": "^10.4.0"
}
}
