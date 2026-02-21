'use client'

import Link from 'next/link'
import { useUserStore } from '@/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'

export function TopBar() {
  const profile = useUserStore((s) => s.profile)
  const getInitials = useUserStore((s) => s.getInitials)

  return (
    <header className="hidden md:block fixed top-0 right-0 left-16 z-40 h-14 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side - can add breadcrumbs or page title later */}
        <div className="flex items-center gap-2">
          {/* Placeholder for future breadcrumbs */}
        </div>

        {/* Right side - User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-accent rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
                {profile.name}
              </span>
              <Icon name="expand_more" size="sm" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.name}</p>
                {profile.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
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
            <DropdownMenuItem className="text-muted-foreground cursor-not-allowed opacity-50">
              <Icon name="logout" size="sm" className="mr-2" />
              Sair (em breve)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
