'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'

interface TranscriptionCardProps {
  text: string
  fileName?: string
  onClear: () => void
}

export function TranscriptionCard({ text, fileName, onClear }: TranscriptionCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar texto')
    }
  }

  return (
    <CardSpotlight className="animate-slide-up p-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
        <CardTitle className="text-lg font-semibold">
          Transcricao
        </CardTitle>
        {fileName && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {fileName}
          </p>
        )}
      </CardHeader>

      <CardContent className="px-6">
        <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
          <TextGenerateEffect
            words={text}
            className="whitespace-pre-wrap"
            filter={true}
            duration={0.3}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 px-6 pb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Nova transcricao
        </Button>
      </CardFooter>
    </CardSpotlight>
  )
}
