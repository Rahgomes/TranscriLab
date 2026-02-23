'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Icon } from '@/components/ui/icon'
import { toast } from 'sonner'

type Provider = 'OPENAI' | 'GROQ' | 'ANTHROPIC' | 'OTHER'
type Purpose = 'TRANSCRIPTION' | 'CHAT' | 'ALL'

interface ApiKey {
  id: string
  provider: Provider
  name: string
  keyHint: string
  purpose: Purpose
  isActive: boolean
  createdAt: string
}

const PROVIDER_INFO: Record<Provider, { label: string; color: string; icon: string }> = {
  OPENAI: { label: 'OpenAI', color: 'bg-green-500', icon: '🟢' },
  GROQ: { label: 'Groq', color: 'bg-amber-500', icon: '🟡' },
  ANTHROPIC: { label: 'Anthropic', color: 'bg-purple-500', icon: '🟣' },
  OTHER: { label: 'Outro', color: 'bg-gray-500', icon: '⚪' },
}

const PURPOSE_LABELS: Record<Purpose, string> = {
  TRANSCRIPTION: 'Transcrição',
  CHAT: 'Chat/Resumo',
  ALL: 'Todos',
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [newKey, setNewKey] = useState({
    provider: 'OPENAI' as Provider,
    name: '',
    apiKey: '',
    purpose: 'ALL' as Purpose,
  })
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/settings/api-keys')
      if (!res.ok) throw new Error('Erro ao carregar chaves')
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (error) {
      toast.error('Erro ao carregar chaves de API')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.apiKey) {
      toast.error('Nome e chave são obrigatórios')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success('Chave de API salva com sucesso!')
      setShowAddDialog(false)
      setNewKey({ provider: 'OPENAI', name: '', apiKey: '', purpose: 'ALL' })
      setShowKey(false)
      fetchKeys()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar chave')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return

    try {
      const res = await fetch(`/api/settings/api-keys?id=${deleteKeyId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao remover')

      toast.success('Chave removida com sucesso!')
      setDeleteKeyId(null)
      fetchKeys()
    } catch (error) {
      toast.error('Erro ao remover chave')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })

      if (!res.ok) throw new Error('Erro ao atualizar')

      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, isActive } : k))
      )
    } catch (error) {
      toast.error('Erro ao atualizar chave')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="key" size="md" className="text-primary" />
                Chaves de API
              </CardTitle>
              <CardDescription>
                Gerencie suas chaves de API para transcrição e chat
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Icon name="add" size="sm" />
              Adicionar Chave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="vpn_key_off" size="xl" className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma chave de API configurada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione suas chaves para usar transcrição e recursos de IA
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${PROVIDER_INFO[key.provider].color}`}
                    >
                      <span className="text-lg">{PROVIDER_INFO[key.provider].icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {PROVIDER_INFO[key.provider].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {PURPOSE_LABELS[key.purpose]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {key.keyHint}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          Adicionada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {key.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                      <Switch
                        checked={key.isActive}
                        onCheckedChange={(checked) => handleToggleActive(key.id, checked)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteKeyId(key.id)}
                    >
                      <Icon name="delete" size="sm" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Chave de API</DialogTitle>
            <DialogDescription>
              A chave será criptografada e você não poderá visualizá-la novamente após salvar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={newKey.provider}
                onValueChange={(v) => setNewKey({ ...newKey, provider: v as Provider })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome (para identificação)</Label>
              <Input
                placeholder="Ex: Minha chave OpenAI"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Chave de API</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={newKey.apiKey}
                  onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowKey(!showKey)}
                >
                  <Icon name={showKey ? 'visibility_off' : 'visibility'} size="sm" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Você só verá esta chave uma vez. Após salvar, apenas os últimos 4 caracteres serão exibidos.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Select
                value={newKey.purpose}
                onValueChange={(v) => setNewKey({ ...newKey, purpose: v as Purpose })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos (Transcrição + Chat)</SelectItem>
                  <SelectItem value="TRANSCRIPTION">Apenas Transcrição</SelectItem>
                  <SelectItem value="CHAT">Apenas Chat/Resumo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddKey} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Chave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover chave de API?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A chave será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
