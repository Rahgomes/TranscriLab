'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHistoryCount } from '@/store'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RecordButton } from '@/features/realtime'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: 'home',
  },
  {
    href: '/history',
    label: 'Histórico',
    icon: 'history',
    showBadge: true,
  },
  {
    href: '/dashboard/usage',
    label: 'Dashboard',
    icon: 'bar_chart',
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: 'settings',
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const count = useHistoryCount()
  const { user, logout } = useAuth()

  const getInitials = () => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b bg-background/80 backdrop-blur-sm px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Icon name="menu" size="md" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg">
                T
              </div>
              <span className="text-xl font-semibold tracking-tight">TranscriLab</span>
            </SheetTitle>
          </SheetHeader>

          {/* User info in sheet */}
          <div className="mt-6 flex items-center gap-3 px-2 py-3 rounded-xl bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                    'hover:bg-accent',
                    isActive && 'bg-accent text-primary'
                  )}
                >
                  <Icon
                    name={item.icon}
                    size="md"
                    fill={isActive ? 1 : 0}
                    weight={isActive ? 500 : 400}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.showBadge && count > 0 && (
                    <Badge variant="secondary" className="h-6 px-2">
                      {count > 99 ? '99+' : count}
                    </Badge>
                  )}
                </Link>
              )
            })}

            <div className="mt-2 pt-2 border-t border-border/50">
              <div onClick={() => setOpen(false)}>
                <RecordButton variant="mobile-nav" />
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              <Icon name="logout" size="md" className="text-red-600" />
              <span className="font-medium">Sair</span>
            </button>
          </nav>

          {/* Theme toggle at bottom of sheet */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>

      {/* Header bar content */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow">
          T
        </div>
        <span className="font-semibold tracking-tight">TranscriLab</span>
      </div>

      {/* Right side: User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              {user?.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Icon name="settings" size="sm" className="mr-2" />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="cursor-pointer">
              <Icon name="person" size="sm" className="mr-2" />
              Editar perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
            <Icon name="logout" size="sm" className="mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
