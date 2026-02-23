'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { useUserStore } from '@/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const settingsItems = [
  {
    title: 'Perfil',
    description: 'Edite seu nome, email e foto',
    icon: 'person',
    href: '/settings/profile',
  },
  {
    title: 'Chaves de API',
    description: 'Configure suas chaves OpenAI, Groq, etc.',
    icon: 'key',
    href: '/settings/api-keys',
  },
  {
    title: 'Aparência',
    description: 'Tema claro, escuro ou automático',
    icon: 'palette',
    href: '/settings/appearance',
    disabled: true,
  },
  {
    title: 'Notificações',
    description: 'Configurar alertas e lembretes',
    icon: 'notifications',
    href: '/settings/notifications',
    disabled: true,
  },
  {
    title: 'Privacidade',
    description: 'Gerenciar dados e exportação',
    icon: 'security',
    href: '/settings/privacy',
    disabled: true,
  },
]

export default function SettingsPage() {
  const profile = useUserStore((s) => s.profile)
  const getInitials = useUserStore((s) => s.getInitials)

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e informações pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">
                {profile.email || 'Email não configurado'}
              </p>
            </div>
            <Link
              href="/settings/profile"
              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
            >
              <Icon name="edit" size="sm" />
              Editar
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            className={item.disabled ? 'cursor-not-allowed' : ''}
          >
            <Card
              className={`h-full transition-all hover:shadow-md ${
                item.disabled
                  ? 'opacity-50'
                  : 'hover:border-primary/50 cursor-pointer'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon name={item.icon} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {item.title}
                      {item.disabled && (
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Em breve
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Version info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>TranscriLab v0.1.0 (DEV)</p>
      </div>
    </div>
  )
}
