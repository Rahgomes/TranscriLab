/** Number of audio channels (mono) */
export const AUDIO_CHANNELS = 1

/** Interval in ms to deliver audio chunks for transcription */
export const CHUNK_INTERVAL_MS = 4000

/** Maximum recording duration in seconds (30 minutes) */
export const MAX_RECORDING_DURATION_S = 30 * 60

/** Warning threshold before max duration in seconds (25 minutes) */
export const DURATION_WARNING_THRESHOLD_S = 25 * 60

/** Maximum concurrent chunk transcription requests */
export const MAX_CONCURRENT_REQUESTS = 2

/** Minimum chunk size in bytes to send for transcription (skip silence) */
export const MIN_CHUNK_SIZE_BYTES = 1000

/** MediaRecorder MIME type for saving audio */
export const RECORDING_MIME_TYPE = 'audio/webm;codecs=opus'

/** Fallback MIME type if opus is not supported */
export const RECORDING_MIME_TYPE_FALLBACK = 'audio/webm'
