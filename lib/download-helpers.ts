// Download helper functions for Contract Generator and Privacy Policy

export async function downloadAsWord(content: string, filename: string): Promise<void> {
    try {
        // Dynamic import to avoid SSR issues
        const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, UnderlineType } = await import('docx')
        const { saveAs } = await import('file-saver')

        // Parse the content into structured sections
        const lines = content.split('\n')
        const paragraphs: any[] = []

        lines.forEach((line) => {
            const trimmedLine = line.trim()

            if (!trimmedLine || trimmedLine === '---') {
                // Empty line or separator - add spacing
                paragraphs.push(new Paragraph({ text: "" }))
            } else if (trimmedLine.startsWith('## ')) {
                // Markdown H2 headers (## TITLE)
                const headerText = trimmedLine.replace(/^## /, '').replace(/\*\*/g, '')
                paragraphs.push(
                    new Paragraph({
                        text: headerText,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 200 }
                    })
                )
            } else if (trimmedLine === 'EMPLOYMENT CONTRACT' || trimmedLine === 'DATA PRIVACY POLICY') {
                // Main title
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                )
            } else if (trimmedLine.match(/^Effective Date:/)) {
                // Effective date
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: trimmedLine, italics: true })
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 200 }
                    })
                )
            } else if (trimmedLine.match(/^\*\*Company Name:\*\*/)) {
                // Company name line
                const companyText = trimmedLine.replace(/\*\*/g, '')
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: companyText, bold: true })
                        ],
                        spacing: { after: 200 }
                    })
                )
            } else if (trimmedLine.match(/^\d+\./)) {
                // Numbered sections (1., 2., etc.)
                const sectionText = trimmedLine.replace(/\*\*/g, '')
                paragraphs.push(
                    new Paragraph({
                        text: sectionText,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    })
                )
            } else if (trimmedLine.match(/^[a-z]\)/)) {
                // Sub-items (a), b), etc.)
                paragraphs.push(
                    new Paragraph({
                        text: "    " + trimmedLine.replace(/\*\*/g, ''),
                        spacing: { after: 100 }
                    })
                )
            } else if (trimmedLine.startsWith('- **')) {
                // Bullet points with bold headers (- **Title**: description)
                const match = trimmedLine.match(/^- \*\*(.+?)\*\*:?\s*(.*)/)
                if (match) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: "• ", bold: true }),
                                new TextRun({ text: match[1], bold: true }),
                                new TextRun({ text: match[2] ? `: ${match[2]}` : '' })
                            ],
                            spacing: { after: 100 }
                        })
                    )
                } else {
                    paragraphs.push(
                        new Paragraph({
                            text: "• " + trimmedLine.replace(/^- /, '').replace(/\*\*/g, ''),
                            spacing: { after: 100 }
                        })
                    )
                }
            } else if (trimmedLine.startsWith('- ')) {
                // Regular bullet points
                paragraphs.push(
                    new Paragraph({
                        text: "• " + trimmedLine.replace(/^- /, '').replace(/\*\*/g, ''),
                        spacing: { after: 100 }
                    })
                )
            } else if (trimmedLine.includes('**')) {
                // Lines with bold text (inline **bold**)
                const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/)
                const textRuns: any[] = []

                parts.forEach(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        textRuns.push(new TextRun({ text: part.replace(/\*\*/g, ''), bold: true }))
                    } else if (part) {
                        textRuns.push(new TextRun({ text: part }))
                    }
                })

                paragraphs.push(
                    new Paragraph({
                        children: textRuns,
                        spacing: { after: 100 }
                    })
                )
            } else {
                // Regular text
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        spacing: { after: 100 }
                    })
                )
            }
        })

        // Create the document
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs
            }]
        })

        // Generate and download
        const blob = await Packer.toBlob(doc)
        saveAs(blob, `${filename}.docx`)

        return Promise.resolve()
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
        // Dynamic import to avoid SSR issues
        const { jsPDF } = await import('jspdf')

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // Set up fonts and styling
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let yPosition = margin

        // Parse content into lines
        const lines = content.split('\n')

        lines.forEach((line, index) => {
            const trimmedLine = line.trim()

            // Check if we need a new page
            if (yPosition > pageHeight - margin) {
                doc.addPage()
                yPosition = margin
            }

            if (!trimmedLine || trimmedLine === '---') {
                // Empty line or separator - add spacing
                yPosition += 5
            } else if (trimmedLine.startsWith('## ')) {
                // H2 Headers
                const headerText = trimmedLine.replace(/^## /, '').replace(/\*\*/g, '')
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                yPosition += 5
                doc.text(headerText, margin, yPosition)
                yPosition += 8
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(10)
            } else if (trimmedLine === 'EMPLOYMENT CONTRACT' || trimmedLine === 'DATA PRIVACY POLICY') {
                // Main title
                doc.setFontSize(18)
                doc.setFont('helvetica', 'bold')
                const titleWidth = doc.getTextWidth(trimmedLine)
                doc.text(trimmedLine, (pageWidth - titleWidth) / 2, yPosition)
                yPosition += 12
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(10)
            } else if (trimmedLine.match(/^Effective Date:/)) {
                // Effective date
                doc.setFont('helvetica', 'italic')
                doc.text(trimmedLine, margin, yPosition)
                yPosition += 6
                doc.setFont('helvetica', 'normal')
            } else if (trimmedLine.match(/^\*\*Company Name:\*\*/)) {
                // Company name
                const text = trimmedLine.replace(/\*\*/g, '')
                doc.setFont('helvetica', 'bold')
                doc.text(text, margin, yPosition)
                yPosition += 6
                doc.setFont('helvetica', 'normal')
            } else if (trimmedLine.match(/^\*\*\d+\./)) {
                // Numbered sections with bold
                const text = trimmedLine.replace(/\*\*/g, '')
                doc.setFont('helvetica', 'bold')
                yPosition += 3
                const splitText = doc.splitTextToSize(text, maxWidth)
                doc.text(splitText, margin, yPosition)
                yPosition += splitText.length * 5 + 2
                doc.setFont('helvetica', 'normal')
            } else if (trimmedLine.match(/^[a-z]\)/)) {
                // Sub-items
                const splitText = doc.splitTextToSize(trimmedLine, maxWidth - 10)
                doc.text(splitText, margin + 10, yPosition)
                yPosition += splitText.length * 5
            } else if (trimmedLine.startsWith('- **')) {
                // Bullet points with bold
                const match = trimmedLine.match(/^- \*\*(.+?)\*\*:?\s*(.*)/)
                if (match) {
                    doc.setFont('helvetica', 'bold')
                    doc.text('•', margin, yPosition)
                    doc.text(match[1], margin + 5, yPosition)
                    doc.setFont('helvetica', 'normal')
                    if (match[2]) {
                        const descWidth = doc.getTextWidth(match[1])
                        const splitDesc = doc.splitTextToSize(`: ${match[2]}`, maxWidth - descWidth - 10)
                        doc.text(splitDesc, margin + 5 + descWidth, yPosition)
                        yPosition += splitDesc.length * 5
                    } else {
                        yPosition += 5
                    }
                } else {
                    const text = trimmedLine.replace(/^- /, '• ').replace(/\*\*/g, '')
                    const splitText = doc.splitTextToSize(text, maxWidth - 5)
                    doc.text(splitText, margin, yPosition)
                    yPosition += splitText.length * 5
                }
            } else if (trimmedLine.startsWith('- ')) {
                // Regular bullet points
                const text = trimmedLine.replace(/^- /, '• ')
                const splitText = doc.splitTextToSize(text, maxWidth - 5)
                doc.text(splitText, margin, yPosition)
                yPosition += splitText.length * 5
            } else if (trimmedLine.includes('**')) {
                // Lines with inline bold text
                const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/)
                let xPosition = margin

                parts.forEach(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        doc.setFont('helvetica', 'bold')
                        const text = part.replace(/\*\*/g, '')
                        doc.text(text, xPosition, yPosition)
                        xPosition += doc.getTextWidth(text)
                        doc.setFont('helvetica', 'normal')
                    } else if (part) {
                        const splitText = doc.splitTextToSize(part, maxWidth - (xPosition - margin))
                        doc.text(splitText, xPosition, yPosition)
                        if (splitText.length > 1) {
                            yPosition += (splitText.length - 1) * 5
                            xPosition = margin
                        } else {
                            xPosition += doc.getTextWidth(part)
                        }
                    }
                })
                yPosition += 5
            } else {
                // Regular text
                const splitText = doc.splitTextToSize(trimmedLine, maxWidth)
                doc.text(splitText, margin, yPosition)
                yPosition += splitText.length * 5
            }
        })

        // Save the PDF
        doc.save(`${filename}.pdf`)

        return Promise.resolve()
    } catch (error) {
        console.error("PDF download error:", error)
        throw error
    }
}
