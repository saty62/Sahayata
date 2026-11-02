import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType
} from 'docx';

const docPath = path.resolve(__dirname, '../../../docs/technical_design_document.md');
const outDocxPath = path.resolve(__dirname, '../../../Technical_Design_Document_Sahayata.docx');

const content = fs.readFileSync(docPath, 'utf-8');
const lines = content.split('\n');

const paragraphs: any[] = [];

// Header banner
paragraphs.push(
  new Paragraph({
    text: 'SAHAYATA (सहायता) — TECHNICAL DESIGN DOCUMENT',
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Hindi-First Women's Welfare Discovery & High-Concurrency Donation Management Platform\n",
        bold: true,
        size: 24,
        color: '245C46',
      }),
      new TextRun({
        text: 'Client: Company A Charitable Trust (Bhopal, Madhya Pradesh)\n',
        italics: true,
        size: 20,
        color: '555555',
      }),
      new TextRun({
        text: 'Version: 1.0.0 (Production Candidate) | Date: November 2026\n',
        size: 18,
        color: '777777',
      }),
    ],
    spacing: { after: 300 },
  })
);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line.startsWith('# ')) {
    paragraphs.push(
      new Paragraph({
        text: line.replace('# ', ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );
  } else if (line.startsWith('## ')) {
    paragraphs.push(
      new Paragraph({
        text: line.replace('## ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
  } else if (line.startsWith('### ')) {
    paragraphs.push(
      new Paragraph({
        text: line.replace('### ', ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
      })
    );
  } else if (line.startsWith('- ') || line.startsWith('* ')) {
    const text = line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        text: text,
        spacing: { after: 60 },
      })
    );
  } else if (/^\d+\.\s+/.test(line)) {
    const text = line.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '');
    paragraphs.push(
      new Paragraph({
        numbering: { reference: 'default-numbering', level: 0 },
        text: text,
        spacing: { after: 60 },
      })
    );
  } else if (line.startsWith('```')) {
    // Collect code block
    const codeLines: string[] = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeLines.push(lines[i]);
      i++;
    }
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: codeLines.join('\n'),
            font: 'Courier New',
            size: 16,
            color: '252B27',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: 'F4F3EE',
        },
        spacing: { before: 120, after: 120 },
      })
    );
  } else {
    // Normal text
    paragraphs.push(
      new Paragraph({
        text: line.replace(/\*\*/g, ''),
        spacing: { after: 100 },
      })
    );
  }
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: paragraphs,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outDocxPath, buffer);
  console.log(`Successfully generated Technical Design Document Word file at: ${outDocxPath}`);
});
