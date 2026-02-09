# Roadmap v4 - Facelift UI TranscriLab

## Visao Geral

Este roadmap documenta as mudancas de UI necessarias para implementar o novo design "TranscriLab", baseado nas 3 telas de referencia fornecidas.

**Telas de Referencia:**
1. **Home/Dashboard** - Upload, uploads ativos, transcritos recentemente
2. **Historico** - Lista de transcricoes com busca e filtros
3. **Detalhes** - Visualizacao completa com resumo IA e acoes

---

## Analise Comparativa: Design Atual vs Novo

### Paleta de Cores

| Elemento | Atual | Novo |
|----------|-------|------|
| Background Light | `hsl(0 0% 100%)` branco puro | `#FBFBFB` / `#F5F5F7` cinza muito suave |
| Background Dark | `hsl(0 0% 3.9%)` quase preto | `#0A0A0A` / `#1C1C1E` preto suave |
| Primary | Cinza escuro (monocromatico) | `#007AFF` azul (Apple Blue) |
| Cards Light | Branco | Branco com bordas mais suaves |
| Cards Dark | Cinza escuro | `#1C1C1E` zinc-900 |
| Muted | Cinza neutro | Slate/Zinc mais quentes |

### Tipografia

| Elemento | Atual | Novo |
|----------|-------|------|
| Font Family | System default | Inter (UI) + Lora (leitura) |
| Font Weights | 400, 500, 600 | 300, 400, 500, 600, 700 |
| Headings | font-semibold | tracking-tight com pesos variados |
| Body Text | text-sm | text-sm com leading-relaxed |
| Leitura longa | Sans-serif | Serif (Lora) com first-letter drop cap |

### Border Radius

| Elemento | Atual | Novo |
|----------|-------|------|
| Padrao | 12px | 12px |
| Cards | 12px | 12px - 16px |
| Buttons | rounded-md (6px) | rounded-lg (12px) |
| Badges | rounded-full | rounded-full ou rounded-md |
| Upload Area | rounded-lg | rounded-2xl (20px) |

### Shadows

| Elemento | Atual | Novo |
|----------|-------|------|
| Cards | shadow (padrao) | shadow-sm com hover:shadow-md |
| Buttons | shadow-sm | shadow-sm ou sem sombra |
| FAB | N/A | shadow-2xl |
| Dialogs | N/A | shadow-xl |

### Icones

| Atual | Novo |
|-------|------|
| lucide-react | Material Icons Outlined (via Google Fonts) |
| Tamanho h-5 w-5 | Tamanho text-xl a text-3xl |

---

## Fase 1: Fundacao (Configuracoes Globais)

### 1.1 Atualizar Tailwind Config

**Arquivo:** `tailwind.config.ts`

**Mudancas:**
```typescript
// Adicionar novas cores
colors: {
  primary: {
    DEFAULT: '#007AFF', // Apple Blue
    foreground: '#FFFFFF',
  },
  'background-light': '#FBFBFB',
  'background-dark': '#0A0A0A',
  'card-light': '#FFFFFF',
  'card-dark': '#1C1C1E',
}

// Atualizar border radius
borderRadius: {
  DEFAULT: '12px',
  'xl': '16px',
  '2xl': '20px',
}
```

### 1.2 Atualizar globals.css

**Arquivo:** `app/globals.css`

**Mudancas:**
- Importar fontes Inter e Lora do Google Fonts
- Atualizar variaveis CSS com novas cores
- Adicionar classes utilitarias customizadas:
  - `.glass` - efeito glassmorphism
  - `.no-scrollbar` - esconder scrollbar
  - `.sidebar-item-active` - estado ativo da sidebar
  - `.custom-scrollbar` - scrollbar estilizado

### 1.3 Instalar Material Icons

**Arquivo:** `app/layout.tsx`

**Mudancas:**
- Adicionar link para Material Icons Outlined do Google Fonts
- Criar componente wrapper `<Icon>` para usar Material Icons

---

## Fase 2: Sistema de Layout

### 2.1 Redesign da Sidebar

**Arquivo:** `components/layout/Sidebar.tsx`

**Mudancas Visuais:**
- Largura: `w-16 md:w-20` (atual: w-16)
- Logo "T" com estilo atualizado (rounded-xl, shadow-lg)
- Espacamento maior entre itens (gap-6 ao inves de gap-2)
- Novos icones de navegacao (Material Icons):
  - `home` - Home
  - `history` - Historico
  - `label_important` ou `folder_open` - Categorias/Pastas
  - `insights` - Insights (futuro)
- Badge de notificacao nos icones (bolinha vermelha)
- Secao inferior com:
  - Toggle dark mode (`dark_mode`)
  - Configuracoes (`settings`)
  - Avatar do usuario (circular com borda)

**Estados:**
- Normal: `text-slate-400`
- Hover: `hover:bg-slate-50 dark:hover:bg-slate-900`
- Active: `bg-slate-100 dark:bg-slate-900 text-primary`

### 2.2 Redesign do MobileNav

**Arquivo:** `components/layout/MobileNav.tsx`

**Mudancas:**
- Header mais limpo com titulo "TranscriLab"
- Menu Sheet com mesmo estilo da Sidebar
- Avatar do usuario no Sheet

### 2.3 Atualizar AppLayout

**Arquivo:** `components/layout/AppLayout.tsx`

**Mudancas:**
- Padding ajustado para nova largura da sidebar
- Background color atualizado

---

## Fase 3: Pagina Home/Dashboard

### 3.1 Header da Pagina

**Arquivo:** `app/(main)/page.tsx`

**Mudancas:**
- Titulo centralizado "TranscriLab" (text-4xl font-semibold tracking-tight)
- Subtitulo "Converta audio em texto com inteligencia artificial"
- Remover header atual e usar novo estilo

### 3.2 Redesign do AudioUploader

**Arquivo:** `features/transcription/components/AudioUploader.tsx`

**Mudancas Visuais:**
- Container com efeito gradient blur no hover:
  ```jsx
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100
                    dark:from-slate-800 dark:to-slate-900 rounded-2xl blur
                    opacity-25 group-hover:opacity-50 transition duration-1000" />
    <div className="relative bg-white dark:bg-slate-900 border-2 border-dashed...">
  ```
- Icone maior em circulo (w-16 h-16)
- Texto principal: "Arraste arquivos de audio aqui" (text-xl font-medium)
- Texto secundario: "ou clique para selecionar do seu computador"
- Formatos suportados em uppercase tracking-widest (MP3 . WAV . M4A . OGG)
- Border radius: rounded-2xl

### 3.3 Nova Secao "Uploads Ativos"

**Novo Componente:** `features/transcription/components/ActiveUploads.tsx`

**Layout:**
```
UPLOADS ATIVOS                           [1 arquivo]
┌─────────────────────────────────────────────────┐
│ entrevista_pesquisa.mp3              14.2 MB    │
│ ████████████████░░░░░░░░░░░                     │
│                        65% concluido [Transcrever]│
└─────────────────────────────────────────────────┘
```

**Elementos:**
- Header: texto uppercase tracking-widest com badge contador
- Card com nome do arquivo e tamanho
- Barra de progresso (h-1.5 rounded-full)
- Porcentagem e botao de acao

### 3.4 Nova Secao "Transcritos Recentemente"

**Novo Componente:** `features/transcription/components/RecentTranscriptions.tsx`

**Layout:**
```
TRANSCRITOS RECENTEMENTE                 [Ver tudo →]
┌──────────────────────┐  ┌──────────────────────┐
│ 📄 Reuniao de...     │  │ 🎤 Ideias Novo...    │
│ [TRABALHO]           │  │ [PESSOAL]            │
│ "Entao, para o..."   │  │ "Lembrar de..."      │
│ 28 Jan • 218 KB      │  │ 27 Jan • 45 KB       │
│ [✨] [Ver Completo]  │  │ [✨] [Ver Completo]  │
└──────────────────────┘  └──────────────────────┘
```

**Elementos:**
- Header com link "Ver tudo"
- Grid 2 colunas (md:grid-cols-2)
- Cards com:
  - Icone de tipo (audio_file, mic)
  - Titulo truncado
  - Badge de categoria colorido
  - Preview do texto (line-clamp-2)
  - Data e tamanho
  - Botoes: gerar resumo (auto_awesome), ver completo

### 3.5 FAB (Floating Action Button)

**Novo Componente:** `components/ui/fab.tsx`

**Estilo:**
```jsx
<button className="fixed bottom-8 right-8 w-14 h-14 bg-black dark:bg-white
                   text-white dark:text-black rounded-full shadow-2xl
                   flex items-center justify-center hover:scale-110
                   transition-transform active:scale-95">
  <span className="material-icons-round">bolt</span>
</button>
```

---

## Fase 4: Pagina de Historico

### 4.1 Redesign do Header

**Arquivo:** `app/(main)/history/page.tsx`

**Mudancas:**
- Layout flex com titulo a esquerda e botao "Categorias" a direita
- Icone de historico ao lado do titulo
- Contador "3 transcricoes salvas"

### 4.2 Redesign da SearchBar

**Arquivo:** `features/history/components/SearchBar.tsx`

**Mudancas:**
- Input com icone de busca interno (search icon a esquerda)
- Placeholder: "Buscar por nome, transcricao ou resumo..."
- Background: `bg-card-light dark:bg-card-dark`
- Border: `border-gray-200 dark:border-zinc-800`
- Focus: `focus:ring-2 focus:ring-primary`
- Selects estilizados para categoria e ordenacao
- Botao de inverter ordem (swap_vert icon)

### 4.3 Redesign do HistoryItem

**Arquivo:** `features/history/components/HistoryItem.tsx`

**Mudancas Visuais:**
- Card com hover border primary/50:
  ```jsx
  className="group bg-card-light dark:bg-card-dark border border-gray-200
             dark:border-zinc-800 p-5 rounded-xl hover:border-primary/50
             transition-all cursor-pointer shadow-sm hover:shadow-md"
  ```
- Nome do arquivo em font-semibold
- Badges de categoria com bolinha colorida:
  ```jsx
  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                   tracking-wider bg-blue-100 text-blue-600">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
    Trabalho
  </span>
  ```
- Badge "RESUMO IA" verde se houver resumo
- Metadata com icones (calendar_today, description)
- Preview do texto com line-clamp-2
- Botoes de acao no hover (opacity-0 group-hover:opacity-100):
  - "Ver Transcricao" (link primary)
  - "Copiar Texto" (link muted)
- Botao de menu (more_horiz) no canto superior direito

### 4.4 FAB Azul

Na pagina de historico, FAB azul com icone "+" para nova transcricao.

---

## Fase 5: Pagina de Detalhes da Transcricao

### 5.1 Nova Rota

**Criar:** `app/(main)/history/[id]/page.tsx`

Esta sera uma pagina dedicada ao inves de modal.

### 5.2 Header da Pagina

**Layout:**
```
[← Voltar]  WhatsApp Ptt 2026-01-25.ogg ✏️     [Copiar] | [Exportar] [Compartilhar]
```

**Elementos:**
- Botao voltar (arrow_back)
- Titulo editavel com icone de edicao
- Botoes de acao: Copiar Texto, Exportar, Compartilhar (primary)

### 5.3 Layout de 2 Colunas

**Estrutura:**
```
┌─────────────────────────────┬──────────────────────┐
│                             │                      │
│   TRANSCRICAO (2/3)         │   SIDEBAR (1/3)      │
│                             │                      │
│   • Trabalho                │   ✨ Resumo da IA    │
│   26 jan 2026 • 03:42       │   [Card resumo]      │
│                             │                      │
│   Texto em fonte serif      │   💡 Pontos Chave    │
│   com first-letter grande   │   • Item 1           │
│   (drop cap)                │   • Item 2           │
│                             │                      │
│   [Resto do texto...]       │   ✅ Acoes Pendentes │
│                             │   [ ] Tarefa 1       │
│                             │   [ ] Tarefa 2       │
│   ─── FIM DA TRANSCRICAO ───│                      │
│                             │   [Player de Audio]  │
└─────────────────────────────┴──────────────────────┘
```

### 5.4 Coluna Principal (Transcricao)

**Estilos:**
- Background: `bg-white dark:bg-zinc-950`
- Padding: `px-12 py-10`
- Max width: `max-w-3xl mx-auto`
- Badge de categoria
- Data e duracao do audio
- Texto em fonte serif (Lora):
  ```jsx
  <article className="prose prose-slate dark:prose-invert prose-lg max-w-none">
    <p className="font-serif leading-relaxed first-letter:text-5xl
                  first-letter:font-bold first-letter:mr-3 first-letter:float-left">
  ```
- Indicador "Fim da Transcricao" no final

### 5.5 Sidebar Lateral

**Estilos:**
- Background: `bg-slate-50/50 dark:bg-zinc-900/30`
- Border left
- Padding: `p-8`
- Scroll customizado

**Secoes:**

1. **Resumo da IA**
   - Icone: auto_awesome (primary)
   - Card com texto do resumo

2. **Pontos Chave**
   - Icone: lightbulb (amber-500)
   - Lista com bullets

3. **Acoes Pendentes** (NOVO - extraido automaticamente pela IA)
   - Icone: task_alt (emerald-500)
   - Checkboxes estilizados com descricao

4. **Player de Audio**
   - Card escuro com botao play
   - Barra de progresso
   - Timestamps (atual / total)

---

## Fase 6: Componentes UI Atualizados

### 6.1 Atualizar Badge

**Arquivo:** `components/ui/badge.tsx`

**Novas Variantes:**
- Cores por categoria (blue, purple, orange, green, etc)
- Com bolinha colorida
- Uppercase tracking-wider

### 6.2 Atualizar Card

**Arquivo:** `components/ui/card.tsx`

**Mudancas:**
- Hover states mais suaves
- Border colors atualizados

### 6.3 Atualizar Button

**Arquivo:** `components/ui/button.tsx`

**Mudancas:**
- Primary com cor azul
- Border radius maior (rounded-lg)

### 6.4 Novo Componente Icon

**Criar:** `components/ui/icon.tsx`

Wrapper para Material Icons:
```jsx
interface IconProps {
  name: string
  className?: string
}

export function Icon({ name, className }: IconProps) {
  return <span className={cn("material-icons-outlined", className)}>{name}</span>
}
```

### 6.5 Novo Componente AudioPlayer

**Criar:** `components/ui/audio-player.tsx`

Player minimalista para reproduzir o audio original.

---

## Fase 7: Melhorias de UX

### 7.1 Transicoes e Animacoes

- Adicionar `transition-all duration-200` em cards
- Hover scale suave em botoes interativos
- Fade in para conteudo carregado
- Slide up para cards novos

### 7.2 Estados de Loading

- Skeleton mais suave
- Animacao de pulse

### 7.3 Feedback Visual

- Toast notifications com estilo atualizado
- Hover states mais visiveis
- Focus rings com cor primary

---

## Checklist de Implementacao

### Fase 1 - Fundacao ✅
- [x] Atualizar tailwind.config.ts com novas cores
- [x] Atualizar globals.css com fontes e variaveis
- [x] Adicionar Material Icons no layout
- [x] Criar componente Icon wrapper

### Fase 2 - Layout ✅
- [x] Redesign Sidebar.tsx
- [x] Redesign MobileNav.tsx
- [x] Atualizar AppLayout.tsx

### Fase 3 - Home ✅
- [x] Atualizar header da pagina
- [x] Redesign AudioUploader.tsx
- [x] Criar ActiveUploads.tsx
- [x] Criar RecentTranscriptions.tsx
- [x] Criar FAB.tsx

### Fase 4 - Historico ✅
- [x] Redesign header da pagina
- [x] Redesign SearchBar.tsx
- [x] Redesign HistoryItem.tsx
- [x] Adicionar FAB azul

### Fase 5 - Detalhes ✅
- [x] Criar rota /history/[id]
- [x] Criar header com acoes
- [x] Criar layout 2 colunas
- [x] Criar coluna de transcricao (serif)
- [x] Criar sidebar com resumo/acoes
- [x] Criar AudioPlayer.tsx

### Fase 6 - Componentes UI ✅
- [x] Atualizar Badge
- [x] Atualizar Card
- [x] Atualizar Button
- [x] Atualizar Input
- [x] Criar Icon wrapper

### Fase 7 - UX ✅
- [x] Adicionar transicoes
- [x] Melhorar loading states
- [x] Melhorar feedback visual

### Fase 8 - Zustand ✅
- [x] Instalar zustand e immer
- [x] Criar estrutura store/
- [x] Implementar useHistoryStore
- [x] Implementar useUploadStore
- [x] Implementar useUIStore
- [x] Migrar HistoryContext para Zustand
- [x] Atualizar componentes para usar stores
- [x] Remover Context antigo
- [x] Adicionar devtools em dev

---

## Estimativa de Arquivos

**Novos arquivos a criar:**
- `components/ui/icon.tsx`
- `components/ui/fab.tsx`
- `components/ui/audio-player.tsx`
- `features/transcription/components/ActiveUploads.tsx`
- `features/transcription/components/RecentTranscriptions.tsx`
- `app/(main)/history/[id]/page.tsx`
- `store/index.ts`
- `store/useHistoryStore.ts`
- `store/useUploadStore.ts`
- `store/useUIStore.ts`
- `store/slices/historySlice.ts` (se necessario)
- `store/slices/categoriesSlice.ts` (se necessario)
- `store/slices/filtersSlice.ts` (se necessario)

**Arquivos a modificar:**
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/MobileNav.tsx`
- `components/layout/AppLayout.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `features/transcription/components/AudioUploader.tsx`
- `features/transcription/hooks/useAudioUpload.ts` (migrar para Zustand)
- `features/history/components/SearchBar.tsx`
- `features/history/components/HistoryItem.tsx`
- `features/history/components/HistoryDetail.tsx`
- `features/history/hooks/useHistorySearch.ts` (migrar para Zustand)
- `app/(main)/page.tsx`
- `app/(main)/history/page.tsx`

**Arquivos a remover:**
- `contexts/HistoryContext.tsx` (migrar para Zustand)

---

## Fase 8: Gerenciamento de Estado com Zustand

### 8.1 Visao Geral

Migrar de React Context para Zustand para melhor performance e DX.

**Instalar:**
```bash
npm install zustand
```

### 8.2 Estrutura de Stores

**Diretorio:** `store/`

```
store/
├── index.ts              # Export de todas as stores
├── useHistoryStore.ts    # Estado do historico
├── useUploadStore.ts     # Estado de uploads
├── useUIStore.ts         # Estado de UI (theme, sidebar, modals)
└── slices/               # Slices para stores grandes
    ├── historySlice.ts
    ├── categoriesSlice.ts
    └── filtersSlice.ts
```

### 8.3 History Store

**Arquivo:** `store/useHistoryStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { HistoryItem, HistoryCategory, SummaryData } from '@/features/history'

interface HistoryState {
  items: HistoryItem[]
  categories: HistoryCategory[]
  isLoading: boolean

  // Actions
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => HistoryItem
  updateItem: (id: string, data: Partial<HistoryItem>) => void
  deleteItem: (id: string) => void
  updateItemSummary: (id: string, summary: SummaryData) => void
  renameFile: (id: string, newName: string) => void
  updateCategory: (id: string, categoryId: string | undefined) => void

  // Category actions
  addCategory: (name: string, color: string) => HistoryCategory
  updateCategoryData: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void

  // Computed
  getCount: () => number
  getItemById: (id: string) => HistoryItem | undefined
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer((set, get) => ({
      items: [],
      categories: [
        { id: 'trabalho', name: 'Trabalho', color: '#3B82F6' },
        { id: 'pessoal', name: 'Pessoal', color: '#8B5CF6' },
        { id: 'estudos', name: 'Estudos', color: '#F97316' },
      ],
      isLoading: false,

      addItem: (itemData) => {
        const newItem: HistoryItem = {
          ...itemData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => {
          state.items.unshift(newItem)
        })
        return newItem
      },

      updateItem: (id, data) => {
        set((state) => {
          const index = state.items.findIndex((item) => item.id === id)
          if (index !== -1) {
            state.items[index] = {
              ...state.items[index],
              ...data,
              updatedAt: new Date().toISOString(),
            }
          }
        })
      },

      deleteItem: (id) => {
        set((state) => {
          state.items = state.items.filter((item) => item.id !== id)
        })
      },

      updateItemSummary: (id, summary) => {
        set((state) => {
          const index = state.items.findIndex((item) => item.id === id)
          if (index !== -1) {
            state.items[index].summary = summary
            state.items[index].updatedAt = new Date().toISOString()
          }
        })
      },

      renameFile: (id, newName) => {
        get().updateItem(id, { fileName: newName })
      },

      updateCategory: (id, categoryId) => {
        get().updateItem(id, { category: categoryId })
      },

      // Category actions
      addCategory: (name, color) => {
        const newCategory: HistoryCategory = {
          id: crypto.randomUUID(),
          name,
          color,
        }
        set((state) => {
          state.categories.push(newCategory)
        })
        return newCategory
      },

      updateCategoryData: (id, name, color) => {
        set((state) => {
          const index = state.categories.findIndex((cat) => cat.id === id)
          if (index !== -1) {
            state.categories[index] = { ...state.categories[index], name, color }
          }
        })
      },

      deleteCategory: (id) => {
        set((state) => {
          state.categories = state.categories.filter((cat) => cat.id !== id)
          // Remove category from items
          state.items.forEach((item) => {
            if (item.category === id) {
              item.category = undefined
            }
          })
        })
      },

      // Computed
      getCount: () => get().items.length,
      getItemById: (id) => get().items.find((item) => item.id === id),
    })),
    {
      name: 'transcrilab-history',
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
      }),
    }
  )
)
```

### 8.4 Upload Store

**Arquivo:** `store/useUploadStore.ts`

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AudioFile, FileStatus } from '@/features/transcription'

interface UploadState {
  files: AudioFile[]

  // Actions
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  updateFileStatus: (id: string, status: FileStatus, data?: Partial<AudioFile>) => void
  updateFileProgress: (id: string, progress: number) => void
  clearAll: () => void

  // Computed
  hasFiles: boolean
  hasPendingFiles: boolean
  isProcessing: boolean
}

export const useUploadStore = create<UploadState>()(
  immer((set, get) => ({
    files: [],

    addFiles: (newFiles) => {
      const audioFiles: AudioFile[] = newFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending' as FileStatus,
        progress: 0,
      }))
      set((state) => {
        state.files.push(...audioFiles)
      })
    },

    removeFile: (id) => {
      set((state) => {
        state.files = state.files.filter((f) => f.id !== id)
      })
    },

    updateFileStatus: (id, status, data) => {
      set((state) => {
        const file = state.files.find((f) => f.id === id)
        if (file) {
          file.status = status
          if (data) Object.assign(file, data)
        }
      })
    },

    updateFileProgress: (id, progress) => {
      set((state) => {
        const file = state.files.find((f) => f.id === id)
        if (file) file.progress = progress
      })
    },

    clearAll: () => {
      set({ files: [] })
    },

    // Computed (usando getters)
    get hasFiles() {
      return get().files.length > 0
    },

    get hasPendingFiles() {
      return get().files.some((f) => f.status === 'pending')
    },

    get isProcessing() {
      return get().files.some((f) =>
        ['uploading', 'transcribing'].includes(f.status)
      )
    },
  }))
)
```

### 8.5 UI Store

**Arquivo:** `store/useUIStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  selectedHistoryId: string | null

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedHistoryId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      selectedHistoryId: null,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedHistoryId: (id) => set({ selectedHistoryId: id }),
    }),
    {
      name: 'transcrilab-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
```

### 8.6 Slices para Stores Grandes

Se a History Store ficar muito grande, separar em slices:

**Arquivo:** `store/slices/historySlice.ts`
```typescript
import type { StateCreator } from 'zustand'

export interface HistorySlice {
  items: HistoryItem[]
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => HistoryItem
  // ...
}

export const createHistorySlice: StateCreator<
  HistorySlice & CategoriesSlice & FiltersSlice,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  items: [],
  addItem: (itemData) => {
    // ...
  },
})
```

**Arquivo:** `store/slices/categoriesSlice.ts`
```typescript
export interface CategoriesSlice {
  categories: HistoryCategory[]
  addCategory: (name: string, color: string) => HistoryCategory
  // ...
}

export const createCategoriesSlice: StateCreator<...> = (set, get) => ({
  // ...
})
```

**Arquivo:** `store/slices/filtersSlice.ts`
```typescript
export interface FiltersSlice {
  search: string
  categoryFilter: string | undefined
  sortBy: 'date' | 'name' | 'size'
  sortOrder: 'asc' | 'desc'
  setSearch: (search: string) => void
  // ...
}
```

**Combinar slices:**
```typescript
// store/useHistoryStore.ts
import { create } from 'zustand'
import { createHistorySlice, HistorySlice } from './slices/historySlice'
import { createCategoriesSlice, CategoriesSlice } from './slices/categoriesSlice'
import { createFiltersSlice, FiltersSlice } from './slices/filtersSlice'

type StoreState = HistorySlice & CategoriesSlice & FiltersSlice

export const useHistoryStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createHistorySlice(...a),
      ...createCategoriesSlice(...a),
      ...createFiltersSlice(...a),
    }),
    { name: 'transcrilab-history' }
  )
)
```

### 8.7 Boas Praticas Zustand

1. **Selectors para Performance**
   ```typescript
   // Evitar re-renders desnecessarios
   const count = useHistoryStore((state) => state.items.length)
   const categories = useHistoryStore((state) => state.categories)

   // Selector com shallow compare para arrays/objects
   import { shallow } from 'zustand/shallow'
   const { items, categories } = useHistoryStore(
     (state) => ({ items: state.items, categories: state.categories }),
     shallow
   )
   ```

2. **Actions Fora do Componente**
   ```typescript
   // Chamar actions sem re-render
   const addItem = useHistoryStore.getState().addItem
   ```

3. **Subscriptions**
   ```typescript
   // Reagir a mudancas especificas
   useHistoryStore.subscribe(
     (state) => state.items.length,
     (count) => console.log('Count changed:', count)
   )
   ```

4. **Devtools**
   ```typescript
   import { devtools } from 'zustand/middleware'

   create<State>()(
     devtools(
       persist(
         (set, get) => ({ ... }),
         { name: 'store-name' }
       ),
       { name: 'TranscriLab' }
     )
   )
   ```

5. **Immer para Imutabilidade**
   ```typescript
   import { immer } from 'zustand/middleware/immer'

   // Permite mutacoes diretas (Immer cuida da imutabilidade)
   set((state) => {
     state.items.push(newItem) // OK com immer
   })
   ```

### 8.8 Migracao do Context para Zustand

**Remover:**
- `contexts/HistoryContext.tsx`

**Atualizar imports:**
```typescript
// Antes
import { useHistory } from '@/contexts/HistoryContext'
const { items, addItem } = useHistory()

// Depois
import { useHistoryStore } from '@/store/useHistoryStore'
const items = useHistoryStore((state) => state.items)
const addItem = useHistoryStore((state) => state.addItem)
```

### 8.9 Checklist Zustand

- [ ] Instalar zustand e immer
- [ ] Criar estrutura store/
- [ ] Implementar useHistoryStore
- [ ] Implementar useUploadStore
- [ ] Implementar useUIStore
- [ ] Migrar HistoryContext para Zustand
- [ ] Atualizar componentes para usar stores
- [ ] Remover Context antigo
- [ ] Adicionar devtools em dev
- [ ] Testar persistencia

---

## Notas de Implementacao

1. **Migracao de Icones**: Manter lucide-react como fallback, migrar gradualmente para Material Icons
2. **Compatibilidade**: Manter funcionalidades existentes, apenas atualizar visual
3. **Dark Mode**: Garantir que todas as mudancas funcionem em ambos os temas
4. **Responsividade**: Testar em mobile, tablet e desktop
5. **Performance**: Lazy load para fontes e icones
6. **Zustand**: Usar selectors para evitar re-renders, separar em slices se necessario

---

## Referencias Visuais

As telas de referencia estao em:
- `stitch_transcrilab_home_dashboard-pg-1.html` - Home/Dashboard
- `stitch_transcrilab_home_dashboard-pg-2.html` - Historico
- `stitch_transcrilab_home_dashboard-pg-3.html` - Detalhes da Transcricao
