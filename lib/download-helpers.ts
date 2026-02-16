// Download helper functions for Contract Generator and Privacy Policy
import type { Paragraph, TextRun } from 'docx'

export async function downloadAsWord(content: string, filename: string): Promise<void> {
    try {
        const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } = await import('docx')
        const { saveAs } = await import('file-saver')

        const lines = content.split('\n')
        const paragraphs: Paragraph[] = []

        // 1. Add Institutional Letterhead
        paragraphs.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({ text: "COMPLYKE INSTITUTIONAL PROTOCOL", bold: true, size: 24, font: "Arial", color: "1a1a1a" }),
                ],
            })
        )
        paragraphs.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({ text: "Statutory Compliance Framework • Section 25/26", size: 16, font: "Arial", color: "666666" }),
                ],
                spacing: { after: 400 }
            })
        )

        // 2. Parse Content
        lines.forEach((line) => {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine === '---') {
                paragraphs.push(new Paragraph({ spacing: { after: 200 } }))
            } else if (trimmedLine === 'EMPLOYMENT CONTRACT' || trimmedLine === 'DATA PRIVACY POLICY') {
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 600 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 12 } }
                    })
                )
            } else if (trimmedLine.startsWith('## ')) {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: trimmedLine.replace(/^## /, '').replace(/\*\*/g, ''), bold: true, size: 28, font: "Arial" })
                        ],
                        spacing: { before: 400, after: 200 }
                    })
                )
            } else if (trimmedLine.includes('**')) {
                const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/)
                const textRuns: TextRun[] = []
                parts.forEach(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        textRuns.push(new TextRun({ text: part.replace(/\*\*/g, ''), bold: true, font: "Arial", size: 22 }))
                    } else if (part) {
                        textRuns.push(new TextRun({ text: part, font: "Arial", size: 22 }))
                    }
                })
                paragraphs.push(new Paragraph({ children: textRuns, spacing: { after: 150 } }))
            } else {
                paragraphs.push(
                    new Paragraph({
                        children: [new TextRun({ text: trimmedLine, font: "Arial", size: 22 })],
                        spacing: { after: 150 }
                    })
                )
            }
        })

        // 3. Add Signature Section
        paragraphs.push(new Paragraph({ spacing: { before: 1200 } }))
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "__________________________             __________________________", bold: true }),
                ],
                alignment: AlignmentType.CENTER
            })
        )
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Employer Authorized Official             Subject Consent Signature", size: 18, font: "Arial" }),
                ],
                alignment: AlignmentType.CENTER
            })
        )

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                children: paragraphs
            }]
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, `${filename}.docx`)
    } catch (error) {
        console.error("Word download error:", error)
        throw error
    }
}

export function downloadAsText(content: string, filename: string): void {
    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Text download error:", error)
        throw error
    }
}

export async function downloadAsPDF(content: string, filename: string): Promise<void> {
    try {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let y = margin

        const checkNewPage = (needed: number) => {
            if (y + needed > pageHeight - margin) {
                doc.addPage()
                y = margin
                addHeader()
            }
        }

        const addHeader = () => {
            doc.setFillColor(26, 26, 26)
            doc.rect(0, 0, pageWidth, 2, 'F')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(14)
            doc.setTextColor(26, 26, 26)
            doc.text("COMPLYKE INSTITUTIONAL PROTOCOL", pageWidth - margin, y + 5, { align: 'right' })

            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text("Statutory Compliance Framework • Section 25/26 - Republic of Kenya", pageWidth - margin, y + 10, { align: 'right' })
            y += 20
        }

        addHeader()

        const lines = content.split('\n')
        lines.forEach((line) => {
            const trimmed = line.trim()
            if (!trimmed || trimmed === '---') {
                y += 5
                return
            }

            if (trimmed === 'EMPLOYMENT CONTRACT' || trimmed === 'DATA PRIVACY POLICY') {
                checkNewPage(20)
                doc.setFontSize(18)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(26, 26, 26)
                const titleWidth = doc.getTextWidth(trimmed)
                doc.text(trimmed, (pageWidth - titleWidth) / 2, y)
                doc.setDrawColor(26, 26, 26)
                doc.line(margin, y + 2, pageWidth - margin, y + 2)
                y += 15
                return
            }

            if (trimmed.startsWith('## ')) {
                checkNewPage(15)
                const text = trimmed.replace(/^## /, '').replace(/\*\*/g, '')
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(26, 26, 26)
                doc.text(text, margin, y)
                y += 10
                return
            }

            // Normal text wrap
            doc.setFontSize(10)
            doc.setTextColor(40, 40, 40)
            const plainText = trimmed.replace(/\*\*/g, '')
            const splitLines = doc.splitTextToSize(plainText, maxWidth)
            checkNewPage(splitLines.length * 6)

            doc.setFont('helvetica', 'normal')
            doc.text(splitLines, margin, y)
            y += splitLines.length * 6
        })

        // Footer signatures
        checkNewPage(40)
        y = Math.max(y, pageHeight - 50)
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, y, margin + 60, y)
        doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text("Employer Authorized Official", margin + 30, y + 5, { align: 'center' })
        doc.text("Subject Consent Signature", pageWidth - margin - 30, y + 5, { align: 'center' })

        doc.save(`${filename}.pdf`)
    } catch (error) {
        console.error("PDF download error:", error)
        throw error
    }
}
