Criar uma aplicação web simples e funcional para transcrição de áudio usando Next.js (App Router), TypeScript, React 19 e OpenAI Whisper API.

Requisitos principais:

Interface amigável com upload de áudio
Suporte a formatos: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
Loader durante processamento
Exibição clara do texto transcrito
Código limpo, legível, sem comentários desnecessários
Variáveis com nomenclatura semântica
Boas práticas React e TypeScript
🗺️ Roadmap de Desenvolvimento
Fase 1: Setup Inicial do Projeto
Objetivo: Configurar ambiente e estrutura base

Tarefas:

Criar projeto Next.js com TypeScript e App Router
Instalar dependências necessárias (openai)
Configurar variáveis de ambiente (.env.local)
Estruturar pastas seguindo padrão feature-based
Estrutura de pastas:

/app
/api
/transcribe
route.ts
/components
AudioUploader.tsx
TranscriptionDisplay.tsx
LoadingSpinner.tsx
page.tsx
layout.tsx
globals.css
/lib
openai.ts
constants.ts
types.ts
Fase 2: Backend - API de Transcrição
Objetivo: Criar endpoint que recebe áudio e retorna transcrição

Arquivo: /app/api/transcribe/route.ts

Lógica:

Receber FormData com arquivo de áudio
Validar presença e tipo do arquivo
Enviar para OpenAI Whisper API
Retornar texto transcrito ou erro apropriado
Implementar tratamento de erros robusto
Validações necessárias:

Arquivo presente
Tamanho máximo (25 MB)
Formato aceito
Configuração OpenAI:

Model: whisper-1
Language: pt (português)
Response format: json
Fase 3: Configuração OpenAI Client
Objetivo: Centralizar configuração da API OpenAI

Arquivo: /lib/openai.ts

Responsabilidades:

Instanciar cliente OpenAI com API key
Exportar instância configurada
Validar presença de API key
Fase 4: Types e Constants
Objetivo: Definir tipos TypeScript e constantes do projeto

Arquivo: /lib/types.ts

typescript
Copiar

export interface TranscriptionResponse {
text: string
}

export interface TranscriptionError {
error: string
}

export interface AudioFile extends File {
type: string
}
Arquivo: /lib/constants.ts

typescript
Copiar

export const ACCEPTED_AUDIO_FORMATS = [
'audio/mpeg',
'audio/mp4',
'audio/wav',
'audio/webm',
'audio/ogg',
'audio/x-m4a'
]

export const MAX*FILE_SIZE_MB = 25
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 \_ 1024
Fase 5: Componente de Upload
Objetivo: Interface para selecionar e enviar arquivo de áudio

Arquivo: /app/components/AudioUploader.tsx

Funcionalidades:

Input file com accept para formatos de áudio
Drag & drop opcional (pode ser v2)
Exibir nome do arquivo selecionado
Botão de upload desabilitado quando sem arquivo
Validação client-side de formato e tamanho
Trigger do estado de loading ao enviar
Chamar API /api/transcribe via fetch
Estados necessários:

selectedFile: File | null
isTranscribing: boolean
transcriptionText: string
errorMessage: string
Estilo:

Design minimalista (preto, branco, cinza)
Estética Apple-like
Responsivo
Fase 6: Componente de Loading
Objetivo: Feedback visual durante processamento

Arquivo: /app/components/LoadingSpinner.tsx

Características:

Spinner animado suave
Texto indicativo: "Transcrevendo áudio…"
Centralizado na tela
Animação CSS pura (sem libs externas)
Fase 7: Componente de Exibição
Objetivo: Mostrar texto transcrito de forma clara

Arquivo: /app/components/TranscriptionDisplay.tsx

Funcionalidades:

Exibir texto transcrito em área legível
Botão para copiar texto
Feedback visual ao copiar
Área scrollável se texto longo
Props:

typescript
Copiar

interface TranscriptionDisplayProps {
text: string
onClear: () => void
}
Fase 8: Página Principal
Objetivo: Orquestrar componentes e fluxo da aplicação

Arquivo: /app/page.tsx

Estrutura:

Header com título do app
AudioUploader component
Renderização condicional:
Loading quando isTranscribing === true
TranscriptionDisplay quando tem texto
Estado vazio inicial
Fluxo:

[Selecionar arquivo]
→ [Validar]
→ [Upload + Loading]
→ [Chamar API]
→ [Exibir resultado ou erro]
Fase 9: Estilização Global
Objetivo: Definir estilos base e variáveis CSS

Arquivo: /app/globals.css

Incluir:

Reset CSS básico
Variáveis de cor (--color-background, --color-text, etc.)
Tipografia (fonte system-ui ou Inter)
Espaçamentos padronizados
Transições suaves
Paleta:

Background: #FFFFFF
Text: #000000
Gray: #6B7280
Border: #E5E7EB
Accent: #000000
Fase 10: Tratamento de Erros
Objetivo: UX clara para cenários de erro

Cenários a tratar:

Arquivo muito grande (>25MB)
Formato não suportado
Erro na API OpenAI
Falta de API key
Sem arquivo selecionado
Implementação:

Mensagens de erro específicas e amigáveis
Exibição temporária (toast ou alert inline)
Permitir retry fácil
Fase 11: Validações e Edge Cases
Objetivo: Garantir robustez

Validações client-side:

Tamanho do arquivo
Tipo MIME do arquivo
Arquivo não vazio
Validações server-side:

Presença de arquivo no FormData
Validação de tipo novamente
Try/catch robusto
Edge cases:

Áudio muito curto (<1s)
Áudio sem fala
Conexão lenta (timeout?)
Fase 12: Otimizações de Performance
Objetivo: Garantir fluidez

Implementações:

Usar use client apenas onde necessário
Memoizar componentes se necessário (React.memo)
Evitar re-renders desnecessários
Lazy loading de componentes pesados (se aplicável)
Fase 13: Acessibilidade
Objetivo: App usável por todos

Checklist:

Labels semânticos em inputs
Aria-labels em botões de ícone
Feedback de loading para screen readers
Contraste adequado de cores
Navegação por teclado funcional
Focus states visíveis
Fase 14: Testes Manuais
Objetivo: Validar funcionamento end-to-end

Cenários de teste:

Upload de arquivo .mp3 pequeno
Upload de arquivo .ogg do WhatsApp
Upload de arquivo >25MB (deve falhar)
Upload de arquivo .txt (deve falhar)
Copiar texto transcrito
Limpar e fazer nova transcrição
Fase 15: Deploy
Objetivo: Colocar em produção

Passos:

Configurar variáveis de ambiente na Vercel
Deploy via Vercel CLI ou GitHub integration
Testar em produção
Validar OPENAI_API_KEY configurada
🎨 Diretrizes de Código
Nomenclatura:
Componentes: PascalCase (AudioUploader)
Funções/variáveis: camelCase (handleFileUpload)
Constantes: UPPER_SNAKE_CASE (MAX_FILE_SIZE_MB)
Tipos: PascalCase com sufixo descritivo (TranscriptionResponse)
Boas Práticas React:
Componentes funcionais com hooks
Evitar prop drilling (estado local suficiente aqui)
Separação de responsabilidades (1 componente = 1 responsabilidade)
Handlers nomeados semanticamente (handleFileSelect, handleTranscribe)
TypeScript:
Tipar todas as props
Tipar retornos de funções assíncronas
Evitar any
Usar interfaces para objetos complexos
Código Limpo:
Sem comentários óbvios
Variáveis auto-explicativas
Funções pequenas e focadas
Early returns para validações
Extrair lógica complexa em helpers
📦 Dependências
json
Copiar

{
"dependencies": {
"next": "^15.x",
"react": "^19.x",
"react-dom": "^19.x",
"openai": "^4.x"
},
"devDependencies": {
"@types/node": "^20.x",
"@types/react": "^19.x",
"@types/react-dom": "^19.x",
"typescript": "^5.x"
}
}
🔐 Variáveis de Ambiente
Arquivo: .env.local

OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
Lembrete: Adicionar .env.local ao .gitignore

✅ Checklist Final
[x] Projeto Next.js criado com TypeScript
[x] Dependências instaladas
[x] API key configurada
[x] Endpoint /api/transcribe funcional
[x] Componente AudioUploader implementado
[x] Componente LoadingSpinner implementado
[x] Componente TranscriptionDisplay implementado
[x] Página principal orquestrando fluxo
[x] Estilos globais aplicados
[x] Validações client e server implementadas
[x] Tratamento de erros robusto
[ ] Testes manuais realizados
[ ] Deploy realizado
[ ] App funcional em produção
