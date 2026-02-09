Blueprint CoT — O que precisa ser feito (somente o que falta)
Vou organizar em passos lógicos de pensamento (CoT), com checklists.

🧩 1) Criar sistema de navegação (Sidebar + Mobile Drawer)
🎯 Objetivo
Organizar a aplicação em duas páginas principais:
• Home (já existe conteúdo)
• Histórico (nova página)

📦 Tarefas
[ ] Criar rota /home
[ ] Criar rota /history
[ ] Adicionar layout com sidebar fixa (desktop)
[ ] Adicionar botão com Sheet (menu lateral mobile)
[ ] Inserir ícone bonito para fechar o menu mobile
[ ] Conectar links (Home / Histórico)
[ ] Mostrar badge com quantidade de itens no histórico
[ ] Animação suave no hover
🧩 2) Criar estrutura completa do Histórico (feature: /history)
📁 Criar feature:
/features/history
/components
/hooks
/utils
/types
/constants
2.1) Tipagens do histórico
🎯 Objetivo
Definir estrutura de dados persistida no localStorage.

📦 Tarefas
[ ] Criar HistoryItem com:
id
fileName
originalFileName
fileSize
duration (opcional)
transcription
summary (opcional)
category (opcional)
createdAt
updatedAt
[ ] Criar HistoryCategory
[ ] Criar HistoryFilters
[ ] Exportar em /features/history/types/index.ts
2.2) Hook: useHistoryStorage
🎯 Objetivo
Persistir, atualizar e deletar histórico localmente.

📦 Tarefas
[ ] Criar getter/setter no localStorage
[ ] Função: addItem
[ ] Função: deleteItem
[ ] Função: updateItem
[ ] Função: renameFile
[ ] Função: updateCategory
[ ] Função: clearHistory
[ ] Função: autoSave quando transcrição é concluída
[ ] Função: atualizar histórico quando resumo for gerado
2.3) Hook: useHistorySearch
🎯 Objetivo
Permitir buscar e filtrar transcrições antigas.

📦 Tarefas
[ ] Busca por nome do arquivo
[ ] Busca por conteúdo da transcrição
[ ] Busca por conteúdo do resumo
[ ] Filtro por categoria
[ ] Ordenação: data / nome / tamanho
[ ] Filtro por range de datas
[ ] Debounce na search bar
🧩 3) Criar UI da página de Histórico
3.1) HistoryScreen layout
📦 Tarefas
[ ] Criar página /history/page.tsx
[ ] Layout com título + descrição
[ ] SearchBar
[ ] Select de categorias
[ ] Botão para gerenciar categorias
[ ] Listagem (HistoryList)
[ ] EmptyState bonito quando não houver nada
3.2) Componentes HistoryList + HistoryItem
📦 Tarefas
[ ] Exibir cada item em um Card
[ ] Mostrar:
nome do arquivo
data formatada (Intl API)
tamanho
preview da transcrição
badge se tiver resumo
badge de categoria
[ ] Menu (dropdown) com:
Ver detalhes
Renomear
Copiar texto
Mudar categoria
Deletar item (modal de confirmação)
3.3) HistoryDetail (modal/dialog)
📦 Tarefas
[ ] Mostrar transcrição completa
[ ] Mostrar resumo (se existir)
[ ] Mostrar insights
[ ] Botão para gerar resumo se não existir
[ ] Botões copiar transcrição / copiar resumo
[ ] Formatação Apple-like no conteúdo
[ ] Scroll agradável dentro do dialog
🧩 4) Criar sistema de Categorias
📦 Tarefas
[ ] Criar CategoryManager (Dialog)
[ ] Criar lista de categorias (nome + cor)
[ ] Adicionar nova categoria
[ ] Editar categoria
[ ] Excluir categoria
[ ] Alterar categoria do item
[ ] Seleção de categoria no HistoryItem
[ ] Usar shadcn/ui: input, color picker, dialog, buttons
🧩 5) Integração Home → Histórico
🎯 Objetivo
Após transcrever qualquer áudio, o item deve ser salvo automaticamente.

📦 Tarefas
[ ] No final da transcrição: chamar addItem()
[ ] Se usuário gerar resumo: updateItem()
[ ] Adicionar toast: “Transcrição salva no histórico”
[ ] Badge do menu atualizar automaticamente
🧩 6) Melhorias de UX gerais faltantes
📦 Tarefas
[ ] Adicionar botão de copiar transcrição direto no Card da Home
[ ] Adicionar botão de copiar resumo direto no SummaryPanel
[ ] Adicionar animação em hover na Sidebar
[ ] Adicionar fechamento suave no mobile menu
[ ] Criar EmptyState específico para Histórico
[ ] Usar ícones suaves (ex.: lucide-react)
[ ] Refinar espaçamentos com scale Apple-like
[ ] Realizar microinterações (scale/opacity)
🧩 7) Revisão final
📦 Tarefas
[ ] Testes manuais de toda a jornada
[ ] Testar vários formatos de áudio (incluindo .ogg WhatsApp)
[ ] Testar múltiplos áudios ao mesmo tempo
[ ] Testar geração de resumo opcional
[ ] Testar histórico vazio / cheio
[ ] Testar filtros / buscas / categorias
[ ] Testar mobile / desktop
[ ] Testar toasts e modais
[ ] Validar UI no tema claro/escuro
📜 LISTA FINAL DE CHECKS (para Claude Code)
Esta aqui é a parte que você realmente vai usar no Claude Code:

🧱 Navegação
[ ] Criar Sidebar (desktop)
[ ] Criar Mobile Drawer (Sheet)
[ ] Configurar rotas Home/History
[ ] Badge com contagem de transcrições
📚 Histórico
[ ] Criar tipos HistoryItem / Category / Filters
[ ] Criar hook useHistoryStorage
[ ] Criar hook useHistorySearch
[ ] Auto-save após transcrição
[ ] Auto-update após resumo
🖥️ UI do Histórico
[ ] Criar /history/page.tsx
[ ] Criar SearchBar
[ ] Criar HistoryList
[ ] Criar HistoryItem
[ ] Criar HistoryDetail (Dialog)
[ ] Criar EmptyState
🏷️ Categorias
[ ] Criar CategoryManager (Dialog)
[ ] Criar CRUD de categorias
[ ] Atribuir categoria ao item
[ ] Filtrar por categoria
🔗 Integração
[ ] Salvar automaticamente no histórico
[ ] Atualizar badge
[ ] Atualizar item após resumo
🎨 Polimento UI
[ ] Animações
[ ] Microinterações
[ ] Ajustes de espaçamento
[ ] Refinar pré-visualizações
🧪 Testes finais
[ ] Verificar UX total
[ ] Testar mobile
[ ] Testar edge cases
