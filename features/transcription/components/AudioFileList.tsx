'use client'

import { AudioFileItem } from './AudioFileItem'
import type { AudioFileState } from '../types'

interface AudioFileListProps {
  files: AudioFileState[]
  onRemove: (id: string) => void
  onRetry?: (id: string) => void
}

export function AudioFileList({ files, onRemove, onRetry }: AudioFileListProps) {
  if (files.length === 0) return null

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <AudioFileItem
          key={file.id}
          file={file}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      ))}
    </div>
  )
}
