import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
} from 'docx'
import type { ExportData, ExportOptions } from '../types'
import { formatTime, formatDate } from './formatTime'

// Cores em hex
const COLORS = {
  primary: '6366F1',
  text: '1E293B',
  muted: '64748B',
  border: 'E2E8F0',
  background: 'F8FAFC',
}

export async function exportToDocx(data: ExportData, options: ExportOptions): Promise<Blob> {
  const children: (Paragraph | Table)[] = []

  // === TÍTULO ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 32,
          color: COLORS.text,
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  )

  // === METADATA ===
  if (options.includeMetadata && data.metadata) {
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

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metaItems.join('  •  '),
            size: 20,
            color: COLORS.muted,
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: COLORS.background,
        },
        spacing: { before: 100, after: 300 },
      })
    )
  }

  // === SEÇÃO TRANSCRIÇÃO ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Transcrição',
          bold: true,
          size: 28,
          color: COLORS.primary,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
      border: {
        bottom: {
          color: COLORS.primary,
          size: 6,
          space: 4,
          style: BorderStyle.SINGLE,
        },
      },
    })
  )

  // Se tem segmentos com diarização
  if (data.segments && data.segments.length > 0) {
    const showTime = options.includeTimestamps
    const showSpeaker = options.includeSpeakerLabels

    // Header da tabela
    const headerCells: TableCell[] = []
    if (showTime) {
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Tempo', bold: true, color: 'FFFFFF', size: 20 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { type: ShadingType.SOLID, color: COLORS.primary },
          width: { size: 12, type: WidthType.PERCENTAGE },
        })
      )
    }
    if (showSpeaker) {
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Falante', bold: true, color: 'FFFFFF', size: 20 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { type: ShadingType.SOLID, color: COLORS.primary },
          width: { size: 18, type: WidthType.PERCENTAGE },
        })
      )
    }
    headerCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Texto', bold: true, color: 'FFFFFF', size: 20 }),
            ],
          }),
        ],
        shading: { type: ShadingType.SOLID, color: COLORS.primary },
        width: { size: showTime && showSpeaker ? 70 : showTime || showSpeaker ? 82 : 100, type: WidthType.PERCENTAGE },
      })
    )

    const rows: TableRow[] = [new TableRow({ children: headerCells, tableHeader: true })]

    // Linhas de dados
    data.segments.forEach((seg, index) => {
      const cells: TableCell[] = []
      const isAlternate = index % 2 === 1

      if (showTime) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: formatTime(seg.startTime), size: 18, color: COLORS.muted }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: isAlternate ? { type: ShadingType.SOLID, color: COLORS.background } : undefined,
          })
        )
      }

      if (showSpeaker) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: seg.speakerLabel || seg.speaker,
                    bold: true,
                    size: 18,
                    color: COLORS.text,
                  }),
                ],
              }),
            ],
            shading: isAlternate ? { type: ShadingType.SOLID, color: COLORS.background } : undefined,
          })
        )
      }

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: seg.text, size: 20, color: COLORS.text })],
            }),
          ],
          shading: isAlternate ? { type: ShadingType.SOLID, color: COLORS.background } : undefined,
        })
      )

      rows.push(new TableRow({ children: cells }))
    })

    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    )
  } else {
    // Transcrição simples
    const paragraphs = data.transcription.split(/\n\n+/)
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para,
              size: 22,
              color: COLORS.text,
            }),
          ],
          spacing: { after: 200 },
        })
      )
    }
  }

  // === RESUMO ===
  if (options.includeSummary && data.summary?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '📋 Resumo',
            bold: true,
            size: 28,
            color: COLORS.primary,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            color: COLORS.primary,
            size: 6,
            space: 4,
            style: BorderStyle.SINGLE,
          },
        },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary.summary,
            size: 22,
            color: COLORS.text,
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  // === INSIGHTS ===
  if (options.includeInsights && data.summary?.insights && data.summary.insights.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '💡 Insights',
            bold: true,
            size: 28,
            color: COLORS.primary,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            color: COLORS.primary,
            size: 6,
            space: 4,
            style: BorderStyle.SINGLE,
          },
        },
      })
    )

    for (const insight of data.summary.insights) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${insight}`,
              size: 22,
              color: COLORS.text,
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }
  }

  // === DOCUMENTO ===
  const doc = new Document({
    creator: 'TranscriLab',
    title: data.title,
    description: 'Transcrição de áudio gerada pelo TranscriLab',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 1080, // 0.75 inch
              right: 1080,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'TranscriLab',
                    bold: true,
                    size: 18,
                    color: COLORS.primary,
                  }),
                  new TextRun({
                    text: '  •  Transcrição de Áudio',
                    size: 18,
                    color: COLORS.muted,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Gerado em ${formatDate(new Date())}  •  Página `,
                    size: 16,
                    color: COLORS.muted,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLORS.muted,
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 16,
                    color: COLORS.muted,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLORS.muted,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}
