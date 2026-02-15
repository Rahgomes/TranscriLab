'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { toast } from 'sonner'
import { DERIVED_CONTENT_TYPES } from '../types/derivedContent'
import type { DerivedContentData } from '../types/derivedContent'

interface DerivedContentCardProps {
  item: DerivedContentData
  onDelete: (id: string) => Promise<void>
}

export function DerivedContentCard({ item, onDelete }: DerivedContentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const typeInfo = DERIVED_CONTENT_TYPES.find((t) => t.type === item.type)
  const formattedDate = new Date(item.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content)
      toast.success('Conteúdo copiado!')
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Arquivo baixado!')
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(item.id)
      toast.success('Conteúdo excluído')
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon
                name={typeInfo?.icon || 'description'}
                size="sm"
                className="text-primary"
              />
              <span className="truncate">{typeInfo?.label || item.type}</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Icon
                name={isExpanded ? 'expand_less' : 'expand_more'}
                size="sm"
                className="text-muted-foreground"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Icon name="more_vert" size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Icon name="content_copy" size="xs" className="mr-2" />
                    Copiar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Icon name="download" size="xs" className="mr-2" />
                    Baixar .txt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Icon name="delete" size="xs" className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.tokensUsed} tokens
            </Badge>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[400px]">
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            </ScrollArea>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                <Icon name="content_copy" size="xs" className="mr-1" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownload}>
                <Icon name="download" size="xs" className="mr-1" />
                Baixar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {typeInfo?.label}?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O conteúdo gerado será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
