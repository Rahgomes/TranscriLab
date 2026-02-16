'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useHistoryCount } from '@/store'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RecordButton } from '@/features/realtime'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: 'home',
  },
  {
    href: '/history',
    label: 'Historico',
    icon: 'history',
    showBadge: true,
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const count = useHistoryCount()

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

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

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
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow">
          T
        </div>
        <span className="font-semibold tracking-tight">TranscriLab</span>
      </div>
      <ThemeToggle />
    </div>
  )
}
