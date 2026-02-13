import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout'
import { DataProvider } from '@/components/providers/DataProvider'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <DataProvider>{children}</DataProvider>
    </AppLayout>
  )
}
