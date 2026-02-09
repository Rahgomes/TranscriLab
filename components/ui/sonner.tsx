'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm',
          title: 'group-[.toast]:font-semibold',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-sm',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg',
          success:
            'group-[.toaster]:bg-success/10 group-[.toaster]:text-success group-[.toaster]:border-success/20',
          error:
            'group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/20',
          warning:
            'group-[.toaster]:bg-amber-500/10 group-[.toaster]:text-amber-600 group-[.toaster]:border-amber-500/20',
          info:
            'group-[.toaster]:bg-primary/10 group-[.toaster]:text-primary group-[.toaster]:border-primary/20',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
