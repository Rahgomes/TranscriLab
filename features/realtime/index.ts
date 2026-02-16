// Components
export { RecordButton } from './components/RecordButton'
export { RecordingOverlay } from './components/RecordingOverlay'
export { WaveformVisualizer } from './components/WaveformVisualizer'
export { LiveTranscript } from './components/LiveTranscript'
export { RecordingControls } from './components/RecordingControls'
export { PostRecordingActions } from './components/PostRecordingActions'

// Hooks
export { useMediaCapture } from './hooks/useMediaCapture'
export { useChunkTranscription } from './hooks/useRealtimeTranscription'
export { useRecordingSession } from './hooks/useRecordingSession'

// Types
export type {
  RecordingPhase,
  MicPermissionState,
  RealtimeSegment,
  RecordingResult,
} from './types'
