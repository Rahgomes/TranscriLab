export const ACCEPTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'video/webm',
] as const

export const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg'

export const MAX_FILE_SIZE_MB = 25
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
