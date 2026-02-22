'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
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
import { useAuth } from '@/components/providers/AuthProvider'
import { useUIStore } from '@/store'

export function TopBar() {
  const { user, logout } = useAuth()
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)

  const getInitials = () => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <motion.header 
      className="hidden md:block fixed top-0 right-0 z-40 h-14 border-b bg-background/80 backdrop-blur-sm"
      animate={{
        left: sidebarOpen ? 224 : 64,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
    >
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
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
                {user?.name || 'Usuário'}
              </span>
              <Icon name="expand_more" size="sm" className="text-muted-foreground" />
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
    </motion.header>
  )
}
