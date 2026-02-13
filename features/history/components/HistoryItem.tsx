'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CardContent } from '@/components/ui/card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CategoryBadge } from './CategoryBadge'
import type { HistoryItem as HistoryItemType, HistoryCategory } from '../types'

interface HistoryItemProps {
  item: HistoryItemType
  categories: HistoryCategory[]
  onView: (item: HistoryItemType) => void
  onRename: (id: string, newName: string) => void
  onUpdateCategory: (id: string, categoryId: string | undefined) => void
  onDelete: (id: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function HistoryItemCard({
  item,
  categories,
  onView,
  onRename,
  onUpdateCategory,
  onDelete,
}: HistoryItemProps) {
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newName, setNewName] = useState(item.fileName)

  function handleNavigate() {
    router.push(`/history/${item.id}`)
  }

  const category = categories.find((c) => c.id === item.category)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.transcription)
      toast.success('Transcricao copiada!')
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  function handleRename() {
    if (newName.trim() && newName !== item.fileName) {
      onRename(item.id, newName.trim())
      toast.success('Arquivo renomeado!')
    }
    setRenameOpen(false)
  }

  function handleDelete() {
    onDelete(item.id)
    setDeleteOpen(false)
    toast.success('Item removido do historico')
  }

  return (
    <>
      <CardSpotlight
        className="group p-5 hover:border-foreground/15 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        onClick={handleNavigate}
      >
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Icon name="audio_file" size="lg" className="text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title and badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate group-hover:text-foreground transition-colors">
                  {item.fileName}
                </h3>
                {category && (
                  <CategoryBadge name={category.name} color={category.color} />
                )}
                {item.hasDiarization && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <Icon name="group" size="xs" />
                    {item.speakerCount ?? '?'} falantes
                  </span>
                )}
                {item.summary && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success px-2 py-0.5 rounded-full">
                    <Icon name="auto_awesome" size="xs" />
                    Resumo IA
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="calendar_today" size="xs" />
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'medium',
                  }).format(new Date(item.createdAt))}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="description" size="xs" />
                  {formatFileSize(item.fileSize)}
                </span>
              </div>

              {/* Preview */}
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {item.transcription}
              </p>

              {/* Actions - visible on hover */}
              <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNavigate()
                  }}
                >
                  Ver Transcricao
                </button>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy()
                  }}
                >
                  Copiar Texto
                </button>
              </div>
            </div>

            {/* Menu button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="more_horiz" size="md" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNavigate}>
                  <Icon name="visibility" size="sm" className="mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Icon name="edit" size="sm" className="mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Icon name="content_copy" size="sm" className="mr-2" />
                  Copiar texto
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Icon name="label" size="sm" className="mr-2" />
                    Categoria
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onUpdateCategory(item.id, undefined)}>
                      <span className="text-muted-foreground">Nenhuma</span>
                    </DropdownMenuItem>
                    {categories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => onUpdateCategory(item.id, cat.id)}
                      >
                        <div
                          className="h-2 w-2 rounded-full mr-2"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Icon name="delete" size="sm" className="mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </CardSpotlight>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear arquivo</DialogTitle>
            <DialogDescription>
              Digite um novo nome para o arquivo.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do arquivo"
            className="rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleRename} className="rounded-xl">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir item</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{item.fileName}"? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
