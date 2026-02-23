'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ApiKeysManager } from '@/features/settings/components/ApiKeysManager'

export default function ApiKeysPage() {
  const router = useRouter()

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/settings')}
          className="rounded-xl"
        >
          <Icon name="arrow_back" size="md" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chaves de API</h1>
          <p className="text-muted-foreground">
            Configure suas chaves para usar serviços de IA
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <ApiKeysManager />

        {/* Info Card */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Icon name="info" size="sm" className="text-primary" />
            Sobre as chaves de API
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>OpenAI:</strong> Transcrição com diarização (GPT-4o) e resumos</li>
            <li>• <strong>Groq:</strong> Transcrição rápida (Whisper) - ideal para tempo real</li>
            <li>• <strong>Anthropic:</strong> Suporte futuro para Claude</li>
            <li>• As chaves são criptografadas e nunca podem ser visualizadas após salvas</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
