'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants'

interface AudioUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function AudioUploader({ onFilesSelected, disabled }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateFiles(files: FileList | null): File[] {
    if (!files) return []

    const validFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size <= MAX_FILE_SIZE_BYTES) {
        validFiles.push(file)
      }
    }

    return validFiles
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const validFiles = validateFiles(e.dataTransfer.files)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const validFiles = validateFiles(e.target.files)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleClick() {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Animated glow border */}
      <div
        className={cn(
          'absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500 blur-sm',
          'bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40',
          'group-hover:opacity-100',
          isDragging && 'opacity-100 blur-md'
        )}
      />

      {/* Main container */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer',
          'flex flex-col items-center justify-center gap-5',
          'bg-card hover:border-primary/50',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Icon circle */}
        <motion.div
          animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'w-16 h-16 rounded-full bg-muted flex items-center justify-center',
            'transition-colors duration-300',
            isDragging && 'bg-primary/10'
          )}
        >
          <Icon
            name="upload_file"
            size="xl"
            className={cn(
              'text-muted-foreground transition-colors',
              isDragging && 'text-primary'
            )}
          />
        </motion.div>

        {/* Text content */}
        <div className="text-center space-y-2">
          <p className="text-xl font-medium">
            Arraste arquivos de audio aqui
          </p>
          <p className="text-muted-foreground">
            ou clique para selecionar do seu computador
          </p>
        </div>

        {/* Supported formats */}
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          MP3 · WAV · M4A · OGG · WebM (max. {MAX_FILE_SIZE_MB}MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          disabled={disabled}
          multiple
          className="hidden"
          aria-label="Selecionar arquivos de audio"
        />
      </motion.div>
    </motion.div>
  )
}
