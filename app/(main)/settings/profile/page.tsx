'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { useUserStore } from '@/store'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const profile = useUserStore((s) => s.profile)
  const setProfile = useUserStore((s) => s.setProfile)
  const getInitials = useUserStore((s) => s.getInitials)

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [isSaving, setIsSaving] = useState(false)

  // Sync with store on mount
  useEffect(() => {
    setName(profile.name)
    setEmail(profile.email)
  }, [profile.name, profile.email])

  const hasChanges = name !== profile.name || email !== profile.email

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setIsSaving(true)
    
    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    setProfile({ name: name.trim(), email: email.trim() })
    toast.success('Perfil atualizado com sucesso!')
    setIsSaving(false)
  }

  function handleCancel() {
    setName(profile.name)
    setEmail(profile.email)
    router.push('/settings')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/settings">
            <Icon name="arrow_back" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>
          <p className="text-muted-foreground">
            Atualize suas informações pessoais
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
          <CardDescription>
            Sua foto será exibida no menu do usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" disabled>
                <Icon name="upload" size="sm" className="mr-2" />
                Enviar foto
              </Button>
              <p className="text-xs text-muted-foreground">
                Disponível em breve. Por enquanto, usamos suas iniciais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          <CardDescription>
            Seus dados básicos de identificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Usado para futuras notificações e recuperação de conta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Icon name="sync" size="sm" className="mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Icon name="check" size="sm" className="mr-2" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>

      {/* Danger Zone - for future */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis relacionadas à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" disabled>
            <Icon name="delete" size="sm" className="mr-2" />
            Excluir todos os dados
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Disponível em breve. Isso apagará todas as suas transcrições e configurações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
