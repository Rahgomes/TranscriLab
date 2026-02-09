'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const initialTheme = stored || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-xl hover:bg-accent"
    >
      <Icon
        name={theme === 'light' ? 'dark_mode' : 'light_mode'}
        size="md"
        className="text-muted-foreground"
      />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
