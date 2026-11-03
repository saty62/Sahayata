import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const docPath = path.resolve(__dirname, '../../../docs/technical_design_document.md');
const outPdfPath = path.resolve(__dirname, '../../../Technical_Design_Document_Sahayata.pdf');

// Read markdown content
const markdownContent = fs.readFileSync(docPath, 'utf-8');

// Replace any non-Latin Unicode characters like Devanagari with their clean Latin transliteration for Type-1 Helvetica font
const sanitizedContent = markdownContent
  .replace(/सहायता/g, 'Sahayata')
  .replace(/[\u0900-\u097F]/g, '');

const lines = sanitizedContent.split('\n');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 45, right: 45 },
  bufferPages: true,
  info: {
    Title: 'Technical Design Document - Sahayata Platform',
    Author: 'Senior Full-Stack & Systems Architect',
    Subject: 'High-Concurrency Donation Management & Welfare Discovery Platform',
    Keywords: 'Sahayata, Technical Design Document, Node.js, MongoDB, Architecture',
    CreationDate: new Date(),
  },
});

const writeStream = fs.createWriteStream(outPdfPath);
doc.pipe(writeStream);

// Track code block state
let inCodeBlock = false;
let codeBlockLines: string[] = [];

// Header banner on first page
doc.rect(0, 0, 595.28, 12).fill('#245C46');

// Title & Meta Block
doc.moveDown(1);
doc.fillColor('#245C46')
   .fontSize(22)
   .font('Helvetica-Bold')
   .text('TECHNICAL DESIGN DOCUMENT', { align: 'center' });

doc.fillColor('#E9AD65')
   .fontSize(16)
   .font('Helvetica-Bold')
   .text('SAHAYATA PLATFORM', { align: 'center' });

doc.moveDown(0.3);
doc.fillColor('#555555')
   .fontSize(10)
   .font('Helvetica-Bold')
   .text("Hindi-First Women's Welfare Discovery & High-Concurrency Donation Management Platform", { align: 'center' });

doc.fillColor('#777777')
   .fontSize(8.5)
   .font('Helvetica-Oblique')
   .text('Client: Company A Charitable Trust (Bhopal, Madhya Pradesh) | Version 1.0.0 | November 2026', { align: 'center' });

doc.moveDown(0.8);
doc.strokeColor('#245C46').lineWidth(1.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(1);

// Helper function to check if page break needed
function checkPageBreak(requiredHeight: number) {
  if (doc.y + requiredHeight > 760) {
    doc.addPage();
    doc.rect(0, 0, 595.28, 6).fill('#245C46');
    doc.moveDown(1);
  }
}

// Table rendering helper
function renderTable(tableRows: string[][]) {
  if (tableRows.length === 0) return;
  
  const colCount = tableRows[0].length;
  const tableWidth = 505;
  const colWidth = tableWidth / colCount;
  
  checkPageBreak(tableRows.length * 20 + 30);
  
  tableRows.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const y = doc.y;
    
    // Background fill
    if (isHeader) {
      doc.rect(45, y, tableWidth, 18).fill('#245C46');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    } else {
      if (rowIndex % 2 === 1) {
        doc.rect(45, y, tableWidth, 16).fill('#F4F6F4');
      }
      doc.fillColor('#252B27').font('Helvetica').fontSize(7.5);
    }
    
    // Cell text
    row.forEach((cell, colIndex) => {
      const cellX = 45 + colIndex * colWidth + 4;
      const cellText = cell.trim().replace(/\*\*/g, '');
      doc.text(cellText, cellX, y + (isHeader ? 4 : 3), {
        width: colWidth - 8,
        height: isHeader ? 14 : 12,
        ellipsis: true,
      });
    });
    
    // Row border
    doc.strokeColor('#DCE9DF').lineWidth(0.5).moveTo(45, y + (isHeader ? 18 : 16)).lineTo(550, y + (isHeader ? 18 : 16)).stroke();
    doc.y = y + (isHeader ? 20 : 17);
  });
  
  doc.moveDown(0.5);
}

let tableBuffer: string[][] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Handle Markdown Table
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    // Skip separator line (| :--- | :--- |)
    if (/^\|[\s\-:]+\|/.test(trimmed)) {
      continue;
    }
    const cols = trimmed.slice(1, -1).split('|').map((c) => c.trim());
    tableBuffer.push(cols);
    continue;
  } else if (tableBuffer.length > 0) {
    renderTable(tableBuffer);
    tableBuffer = [];
  }

  // Handle Code Blocks (```)
  if (trimmed.startsWith('```')) {
    if (!inCodeBlock) {
      inCodeBlock = true;
      codeBlockLines = [];
    } else {
      inCodeBlock = false;
      // Render buffered code block
      checkPageBreak(codeBlockLines.length * 10 + 20);
      const codeY = doc.y;
      const blockHeight = Math.min(codeBlockLines.length * 11 + 10, 200);
      doc.rect(45, codeY, 505, blockHeight).fill('#F8F9F8');
      doc.strokeColor('#DCE9DF').lineWidth(0.8).rect(45, codeY, 505, blockHeight).stroke();
      
      doc.fillColor('#1F2937').font('Courier').fontSize(7.5);
      let lineY = codeY + 6;
      for (const cl of codeBlockLines) {
        if (lineY > codeY + blockHeight - 10) break;
        doc.text(cl, 52, lineY, { width: 490 });
        lineY += 10.5;
      }
      doc.y = codeY + blockHeight + 8;
    }
    continue;
  }

  if (inCodeBlock) {
    codeBlockLines.push(line);
    continue;
  }

  // Empty Line
  if (!trimmed) {
    doc.moveDown(0.25);
    continue;
  }

  // Heading 1 (# )
  if (trimmed.startsWith('# ')) {
    checkPageBreak(50);
    doc.moveDown(0.6);
    const title = trimmed.replace('# ', '').replace(/\*\*/g, '');
    doc.fillColor('#245C46')
       .fontSize(15)
       .font('Helvetica-Bold')
       .text(title, { align: 'left' });
    doc.moveDown(0.2);
    doc.strokeColor('#BACFC0').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.4);
    continue;
  }

  // Heading 2 (## )
  if (trimmed.startsWith('## ')) {
    checkPageBreak(40);
    doc.moveDown(0.5);
    const title = trimmed.replace('## ', '').replace(/\*\*/g, '');
    doc.fillColor('#245C46')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(title);
    doc.moveDown(0.2);
    continue;
  }

  // Heading 3 (### )
  if (trimmed.startsWith('### ')) {
    checkPageBreak(30);
    doc.moveDown(0.35);
    const title = trimmed.replace('### ', '').replace(/\*\*/g, '');
    doc.fillColor('#252B27')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(title);
    doc.moveDown(0.15);
    continue;
  }

  // Horizontal divider
  if (trimmed === '---') {
    doc.moveDown(0.3);
    doc.strokeColor('#E8E5DD').lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    continue;
  }

  // Bullet point (- or *)
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    checkPageBreak(18);
    const text = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
    doc.fillColor('#333333')
       .fontSize(8.5)
       .font('Helvetica')
       .text('•  ', { indent: 10, continued: true })
       .text(text, { lineGap: 1.5 });
    continue;
  }

  // Numbered list (1. 2. etc.)
  if (/^\d+\.\s+/.test(trimmed)) {
    checkPageBreak(18);
    const text = trimmed.replace(/\*\*/g, '');
    doc.fillColor('#333333')
       .fontSize(8.5)
       .font('Helvetica')
       .text(text, { indent: 10, lineGap: 1.5 });
    continue;
  }

  // Regular paragraph
  checkPageBreak(18);
  const cleanLine = trimmed.replace(/\*\*/g, '').replace(/`/g, '');
  doc.fillColor('#252B27')
     .fontSize(8.5)
     .font('Helvetica')
     .text(cleanLine, { lineGap: 2 });
}

// Flush any lingering table
if (tableBuffer.length > 0) {
  renderTable(tableBuffer);
}

// Global Running Header and Footer on all pages
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  // Header on pages > 0
  if (i > 0) {
    doc.rect(0, 0, 595.28, 4).fill('#245C46');
    doc.fillColor('#888888')
       .fontSize(7)
       .font('Helvetica')
       .text('Sahayata Platform — Technical Design Document', 45, 16, { align: 'left', width: 505 });
    doc.strokeColor('#E8E5DD').lineWidth(0.5).moveTo(45, 26).lineTo(550, 26).stroke();
  }
  
  // Running Footer on all pages
  doc.strokeColor('#E8E5DD').lineWidth(0.5).moveTo(45, 795).lineTo(550, 795).stroke();
  doc.fillColor('#718096')
     .fontSize(7)
     .font('Helvetica')
     .text('Company A Charitable Trust (Bhopal, MP) — Confidential Evaluator Copy', 45, 804, { align: 'left', width: 350 });
  
  doc.text(`Page ${i + 1} of ${range.count}`, 450, 804, { align: 'right', width: 100 });
}

doc.end();

writeStream.on('finish', () => {
  console.log(`Successfully generated Technical Design Document PDF at: ${outPdfPath}`);
});
