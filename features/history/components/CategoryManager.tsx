'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORY_COLORS } from '../constants'
import type { HistoryCategory } from '../types'

interface CategoryManagerProps {
  categories: HistoryCategory[]
  onAdd: (name: string, color: string) => void
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
}

export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<HistoryCategory | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  function resetForm() {
    setName('')
    setColor(CATEGORY_COLORS[0])
    setEditingCategory(null)
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
      setDeleteConfirmId(null)
    }
  }

  function handleEdit(category: HistoryCategory) {
    setEditingCategory(category)
    setName(category.name)
    setColor(category.color)
    setDeleteConfirmId(null)
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Digite um nome para a categoria')
      return
    }

    if (editingCategory) {
      onUpdate(editingCategory.id, name.trim(), color)
      toast.success('Categoria atualizada!')
    } else {
      onAdd(name.trim(), color)
      toast.success('Categoria criada!')
    }

    resetForm()
  }

  function handleDelete(id: string) {
    onDelete(id)
    setDeleteConfirmId(null)
    toast.success('Categoria excluida!')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Crie e organize categorias para suas transcricoes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da categoria</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reunioes"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingCategory ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>

            {editingCategory && (
              <Button variant="ghost" onClick={resetForm} className="w-full">
                Cancelar edicao
              </Button>
            )}
          </div>

          {/* List */}
          {categories.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground">Categorias existentes</Label>
              <div className="mt-2 space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>

                    {deleteConfirmId === category.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
