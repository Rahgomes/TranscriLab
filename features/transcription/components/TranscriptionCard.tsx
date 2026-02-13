'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Home } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { SegmentedTranscript } from '@/features/history/components/SegmentedTranscript'
import type { TranscriptionSegment } from '@/features/transcription/types'
import { extractSpeakerInfo } from '@/lib/segments'

interface TranscriptionCardProps {
  text: string
  fileName?: string
  segments?: TranscriptionSegment[]
  hasDiarization?: boolean
  onClear: () => void
}

export function TranscriptionCard({ text, fileName, segments, hasDiarization, onClear }: TranscriptionCardProps) {
  const [copied, setCopied] = useState(false)

  const speakers = useMemo(
    () => (segments && segments.length > 0 ? extractSpeakerInfo(segments) : []),
    [segments],
  )

  const showSegmented = hasDiarization && segments && segments.length > 0

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
          Transcrição
        </CardTitle>
        {fileName && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {fileName}
          </p>
        )}
      </CardHeader>

      <CardContent className="px-6">
        <div className="max-h-[500px] overflow-y-auto rounded-lg">
          {showSegmented ? (
            <SegmentedTranscript
              segments={segments}
              speakers={speakers}
              activeSegmentIndex={-1}
              onSegmentClick={() => {}}
            />
          ) : (
            <article className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-6 p-4">
              {text.split(/\n\n+/).map((paragraph, index) => (
                <p
                  key={index}
                  className={`font-serif text-lg leading-relaxed ${index === 0 ? 'drop-cap' : ''}`}
                >
                  {paragraph}
                </p>
              ))}
            </article>
          )}
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
          <Home className="w-4 h-4 mr-2" />
          Voltar ao início
        </Button>
      </CardFooter>
    </CardSpotlight>
  )
}
