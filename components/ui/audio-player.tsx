'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'
import { Button } from './button'
import { Slider } from './slider'

export interface AudioPlayerHandle {
  seekTo: (time: number) => void
  play: () => void
  pause: () => void
}

interface AudioPlayerProps {
  src?: string
  fileName?: string
  className?: string
  onTimeUpdate?: (currentTime: number) => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ src, fileName, className, onTimeUpdate }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)

    useImperativeHandle(ref, () => ({
      seekTo(time: number) {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.max(0, Math.min(duration, time))
        setCurrentTime(audio.currentTime)
      },
      play() {
        const audio = audioRef.current
        if (!audio) return
        audio.play()
        setIsPlaying(true)
      },
      pause() {
        const audio = audioRef.current
        if (!audio) return
        audio.pause()
        setIsPlaying(false)
      },
    }), [duration])

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const handleLoadedMetadata = () => {
        setDuration(audio.duration)
        setIsLoaded(true)
      }

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
        onTimeUpdate?.(audio.currentTime)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }

      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
      }
    }, [onTimeUpdate])

    function togglePlay() {
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }

    function handleSeek(value: number[]) {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }

    function skipTime(seconds: number) {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    }

    if (!src) {
      return (
        <div
          className={cn(
            'rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground',
            className
          )}
        >
          <Icon name="music_off" size="lg" className="mx-auto mb-2" />
          <p>Audio nao disponivel</p>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'rounded-xl bg-zinc-900 dark:bg-zinc-950 p-4 text-white',
          className
        )}
      >
        <audio ref={audioRef} src={src} preload="metadata" />

        {/* File name */}
        {fileName && (
          <div className="flex items-center gap-2 mb-3">
            <Icon name="audio_file" size="sm" className="text-zinc-400" />
            <span className="text-sm text-zinc-300 truncate">{fileName}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!isLoaded}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_.bg-primary]:bg-white [&_[data-orientation=horizontal]]:h-1"
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-zinc-400 mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(-10)}
            disabled={!isLoaded}
            className="h-10 w-10 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Icon name="replay_10" size="md" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            disabled={!isLoaded}
            className="h-14 w-14 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 hover:text-zinc-900"
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} size="lg" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(10)}
            disabled={!isLoaded}
            className="h-10 w-10 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Icon name="forward_10" size="md" />
          </Button>
        </div>
      </div>
    )
  }
)
