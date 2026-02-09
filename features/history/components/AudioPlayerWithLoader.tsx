'use client'

import { useState, useEffect } from 'react'
import { getAudio } from '@/lib/audioStorage'
import { AudioPlayer } from '@/components/ui/audio-player'

interface AudioPlayerWithLoaderProps {
  historyId: string
}

export function AudioPlayerWithLoader({ historyId }: AudioPlayerWithLoaderProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let url: string | null = null

    async function loadAudio() {
      try {
        const audio = await getAudio(historyId)
        if (audio) {
          url = URL.createObjectURL(audio.blob)
          setAudioUrl(url)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadAudio()

    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [historyId])

  if (loading) {
    return (
      <div className="rounded-xl bg-zinc-900 dark:bg-zinc-950 p-4 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-1/2 mb-3" />
        <div className="h-1 bg-zinc-700 rounded w-full mb-3" />
        <div className="flex justify-between mb-4">
          <div className="h-3 bg-zinc-700 rounded w-10" />
          <div className="h-3 bg-zinc-700 rounded w-10" />
        </div>
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-zinc-700 rounded-full" />
        </div>
      </div>
    )
  }

  if (error || !audioUrl) {
    return (
      <div className="rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        <p>Audio nao disponivel</p>
        <p className="text-xs mt-1">O arquivo pode ter sido removido</p>
      </div>
    )
  }

  return <AudioPlayer src={audioUrl} />
}
