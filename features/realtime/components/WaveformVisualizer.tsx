'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null
  isActive: boolean
  className?: string
}

export function WaveformVisualizer({
  analyserNode,
  isActive,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserNode) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      if (!ctx || !canvas || !analyserNode) return

      animationRef.current = requestAnimationFrame(draw)

      // Get CSS computed colors
      const computedStyle = getComputedStyle(canvas)
      const primaryColor = computedStyle.getPropertyValue('--primary').trim()
      const mutedColor = computedStyle.getPropertyValue('--muted').trim()

      const activeColor = primaryColor
        ? `hsl(${primaryColor})`
        : '#6366f1'
      const idleColor = mutedColor
        ? `hsl(${mutedColor})`
        : '#94a3b8'

      // Scale canvas for high-DPI
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      if (isActive) {
        analyserNode.getByteFrequencyData(dataArray)
      }

      // Draw frequency bars
      const barCount = 48
      const gap = 3
      const barWidth = (width - (barCount - 1) * gap) / barCount
      const centerY = height / 2

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength)
        const value = isActive ? dataArray[dataIndex] / 255 : 0.05
        const barHeight = Math.max(4, value * (height * 0.8))

        const x = i * (barWidth + gap)
        const y = centerY - barHeight / 2

        ctx.fillStyle = isActive ? activeColor : idleColor
        ctx.globalAlpha = isActive ? 0.4 + value * 0.6 : 0.3
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyserNode, isActive])

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.5 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.5 }}
      transition={{ duration: 0.3 }}
      className={cn('w-full', className)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-24 md:h-32"
        style={{ display: 'block' }}
      />
    </motion.div>
  )
}
