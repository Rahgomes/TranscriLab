'use client'

import { useState, useCallback, useMemo } from 'react'
import type { TranscriptionSegment } from '@/features/transcription/types'

export interface EditableSegment extends TranscriptionSegment {
  isModified: boolean
}

interface EditorState {
  isEditMode: boolean
  editableSegments: EditableSegment[]
  editableText: string
  originalSegments: TranscriptionSegment[]
  originalText: string
  isDirty: boolean
  isSaving: boolean
}

interface EditorActions {
  enterEditMode: () => void
  exitEditMode: () => void
  setSegmentText: (index: number, text: string) => void
  setSegmentSpeakerLabel: (index: number, speakerLabel: string) => void
  setSegmentTimestamps: (index: number, startTime: number, endTime: number) => void
  setEditableText: (text: string) => void
  resetEdits: () => void
  setIsSaving: (saving: boolean) => void
  getChangedSegments: () => EditableSegment[]
  applyUpdatedSegments: (segments: TranscriptionSegment[]) => void
}

export function useEditorState(
  segments: TranscriptionSegment[],
  transcriptionText: string,
): EditorState & EditorActions {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editableSegments, setEditableSegments] = useState<EditableSegment[]>([])
  const [editableText, setEditableTextState] = useState('')
  const [originalSegments, setOriginalSegments] = useState<TranscriptionSegment[]>([])
  const [originalText, setOriginalText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const enterEditMode = useCallback(() => {
    setOriginalSegments(segments)
    setOriginalText(transcriptionText)
    setEditableSegments(
      segments.map((s) => ({ ...s, isModified: false }))
    )
    setEditableTextState(transcriptionText)
    setIsEditMode(true)
  }, [segments, transcriptionText])

  const exitEditMode = useCallback(() => {
    setIsEditMode(false)
    setEditableSegments([])
    setEditableTextState('')
  }, [])

  const setSegmentText = useCallback((index: number, text: string) => {
    setEditableSegments((prev) =>
      prev.map((s) => {
        if (s.index !== index) return s
        const original = segments.find((orig) => orig.index === index)
        const isModified = text !== (original?.text ?? '')
          || (s.speakerLabel ?? null) !== (original?.speakerLabel ?? null)
          || s.startTime !== (original?.startTime ?? 0)
          || s.endTime !== (original?.endTime ?? 0)
        return { ...s, text, isModified }
      })
    )
  }, [segments])

  const setSegmentSpeakerLabel = useCallback((index: number, speakerLabel: string) => {
    setEditableSegments((prev) =>
      prev.map((s) => {
        if (s.index !== index) return s
        const original = segments.find((orig) => orig.index === index)
        const label = speakerLabel.trim() || undefined
        const isModified = s.text !== (original?.text ?? '')
          || (label ?? null) !== (original?.speakerLabel ?? null)
          || s.startTime !== (original?.startTime ?? 0)
          || s.endTime !== (original?.endTime ?? 0)
        return { ...s, speakerLabel: label, isModified }
      })
    )
  }, [segments])

  const setSegmentTimestamps = useCallback((index: number, startTime: number, endTime: number) => {
    setEditableSegments((prev) =>
      prev.map((s) => {
        if (s.index !== index) return s
        const original = segments.find((orig) => orig.index === index)
        const isModified = s.text !== (original?.text ?? '')
          || (s.speakerLabel ?? null) !== (original?.speakerLabel ?? null)
          || startTime !== (original?.startTime ?? 0)
          || endTime !== (original?.endTime ?? 0)
        return { ...s, startTime, endTime, isModified }
      })
    )
  }, [segments])

  const setEditableText = useCallback((text: string) => {
    setEditableTextState(text)
  }, [])

  const resetEdits = useCallback(() => {
    setEditableSegments(
      segments.map((s) => ({ ...s, isModified: false }))
    )
    setEditableTextState(transcriptionText)
  }, [segments, transcriptionText])

  const getChangedSegments = useCallback(() => {
    return editableSegments.filter((s) => s.isModified)
  }, [editableSegments])

  const applyUpdatedSegments = useCallback((updatedSegments: TranscriptionSegment[]) => {
    setOriginalSegments(updatedSegments)
    setEditableSegments(
      updatedSegments.map((s) => ({ ...s, isModified: false }))
    )
  }, [])

  const isDirty = useMemo(() => {
    if (!isEditMode) return false

    // Check segments
    if (editableSegments.some((s) => s.isModified)) return true

    // Check plain text
    if (editableText !== originalText) return true

    return false
  }, [isEditMode, editableSegments, editableText, originalText])

  return {
    isEditMode,
    editableSegments,
    editableText,
    originalSegments,
    originalText,
    isDirty,
    isSaving,
    enterEditMode,
    exitEditMode,
    setSegmentText,
    setSegmentSpeakerLabel,
    setSegmentTimestamps,
    setEditableText,
    resetEdits,
    setIsSaving,
    getChangedSegments,
    applyUpdatedSegments,
  }
}
