import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportData, ExportOptions } from '../types'
import { formatTime, formatDate } from './formatTime'

// Cores do tema
const COLORS = {
  primary: [99, 102, 241] as [number, number, number], // Indigo
  text: [30, 41, 59] as [number, number, number], // Slate 800
  muted: [100, 116, 139] as [number, number, number], // Slate 500
  border: [226, 232, 240] as [number, number, number], // Slate 200
  background: [248, 250, 252] as [number, number, number], // Slate 50
}

export async function exportToPdf(data: ExportData, options: ExportOptions): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // === HEADER ===
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('TranscriLab', margin, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Transcrição de Áudio', margin, 22)

  doc.setFontSize(8)
  doc.text(`Exportado em ${formatDate(new Date())}`, margin, 28)

  y = 45

  // === TÍTULO ===
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(data.title, contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 5

  // === METADATA ===
  if (options.includeMetadata && data.metadata) {
    doc.setFillColor(...COLORS.background)
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)

    const metaItems = [
      `📅 ${formatDate(data.createdAt)}`,
      `📝 ${data.metadata.wordCount.toLocaleString()} palavras`,
      `📊 ${data.metadata.charCount.toLocaleString()} caracteres`,
    ]

    if (data.metadata.speakerCount) {
      metaItems.push(`👥 ${data.metadata.speakerCount} participantes`)
    }

    if (data.metadata.duration) {
      metaItems.push(`⏱️ ${formatTime(data.metadata.duration)}`)
    }

    const metaText = metaItems.join('  •  ')
    doc.text(metaText, margin + 5, y + 12)
    y += 28
  }

  // === TRANSCRIÇÃO ===
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Transcrição', margin, y)
  y += 8

  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 30, y)
  y += 8

  // Se tem segmentos com diarização
  if (data.segments && data.segments.length > 0) {
    const tableData = data.segments.map((seg) => {
      const time = options.includeTimestamps ? formatTime(seg.startTime) : ''
      const speaker = options.includeSpeakerLabels
        ? seg.speakerLabel || seg.speaker
        : ''
      return [time, speaker, seg.text]
    })

    autoTable(doc, {
      startY: y,
      head: options.includeTimestamps || options.includeSpeakerLabels
        ? [['Tempo', 'Falante', 'Texto']]
        : undefined,
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: COLORS.border,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: options.includeTimestamps ? 18 : 0, halign: 'center' },
        1: { cellWidth: options.includeSpeakerLabels ? 25 : 0, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
      didDrawPage: (data) => {
        // Footer em cada página
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.muted)
        doc.text(
          `Página ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10
  } else {
    // Transcrição simples (sem diarização)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const paragraphs = data.transcription.split(/\n\n+/)
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, contentWidth)

      // Verifica se precisa de nova página
      if (y + lines.length * 5 > pageHeight - 30) {
        doc.addPage()
        y = margin
      }

      doc.text(lines, margin, y)
      y += lines.length * 5 + 5
    }
  }

  // === RESUMO ===
  if (options.includeSummary && data.summary?.summary) {
    // Verifica espaço
    if (y + 50 > pageHeight - 30) {
      doc.addPage()
      y = margin
    }

    y += 5
    doc.setFillColor(...COLORS.background)
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')

    doc.setTextColor(...COLORS.primary)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('📋 Resumo', margin + 3, y + 6)
    y += 15

    doc.setTextColor(...COLORS.text)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const summaryLines = doc.splitTextToSize(data.summary.summary, contentWidth)

    // Verifica se precisa de nova página
    if (y + summaryLines.length * 5 > pageHeight - 30) {
      doc.addPage()
      y = margin
    }

    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 10
  }

  // === INSIGHTS ===
  if (options.includeInsights && data.summary?.insights && data.summary.insights.length > 0) {
    // Verifica espaço
    if (y + 30 > pageHeight - 30) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(...COLORS.background)
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')

    doc.setTextColor(...COLORS.primary)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('💡 Insights', margin + 3, y + 6)
    y += 15

    doc.setTextColor(...COLORS.text)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    for (const insight of data.summary.insights) {
      const insightLines = doc.splitTextToSize(`• ${insight}`, contentWidth - 5)

      if (y + insightLines.length * 5 > pageHeight - 30) {
        doc.addPage()
        y = margin
      }

      doc.text(insightLines, margin + 3, y)
      y += insightLines.length * 5 + 3
    }
  }

  // Footer final
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(
      `Gerado por TranscriLab • ${formatDate(new Date())}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
