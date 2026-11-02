import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const docPath = path.resolve(__dirname, '../../../docs/technical_design_document.md');
const outPdfPath = path.resolve(__dirname, '../../../Technical_Design_Document_Sahayata.pdf');
const fontPath = path.resolve(__dirname, '../assets/fonts/NotoSansDevanagari-Regular.ttf');

const markdownContent = fs.readFileSync(docPath, 'utf-8');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outPdfPath);
doc.pipe(writeStream);

if (fs.existsSync(fontPath)) {
  doc.registerFont('Devanagari', fontPath);
}

const lines = markdownContent.split('\n');

doc.rect(0, 0, 595.28, 8).fill('#245C46');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) {
    doc.moveDown(0.3);
    continue;
  }

  // Heading 1
  if (line.startsWith('# ')) {
    doc.moveDown(0.5);
    const title = line.replace('# ', '');
    doc.fillColor('#245C46')
       .fontSize(16)
       .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica-Bold')
       .text(title, { align: 'left' });
    doc.moveDown(0.2);
    doc.strokeColor('#DCE9DF').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.4);
    continue;
  }

  // Heading 2
  if (line.startsWith('## ')) {
    doc.moveDown(0.4);
    const title = line.replace('## ', '');
    doc.fillColor('#245C46')
       .fontSize(13)
       .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica-Bold')
       .text(title);
    doc.moveDown(0.2);
    continue;
  }

  // Heading 3
  if (line.startsWith('### ')) {
    doc.moveDown(0.3);
    const title = line.replace('### ', '');
    doc.fillColor('#252B27')
       .fontSize(11)
       .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica-Bold')
       .text(title);
    doc.moveDown(0.15);
    continue;
  }

  // List bullet
  if (line.startsWith('- ') || line.startsWith('* ')) {
    const text = line.replace(/^[-*]\s+/, '');
    doc.fillColor('#333333')
       .fontSize(9.5)
       .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica')
       .text(`•  ${text.replace(/\*\*/g, '')}`, { indent: 12, lineGap: 2 });
    continue;
  }

  // Numbered list
  if (/^\d+\.\s+/.test(line)) {
    doc.fillColor('#333333')
       .fontSize(9.5)
       .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica')
       .text(line.replace(/\*\*/g, ''), { indent: 12, lineGap: 2 });
    continue;
  }

  // Horizontal divider
  if (line === '---') {
    doc.moveDown(0.3);
    doc.strokeColor('#E8E5DD').lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    continue;
  }

  // Code or blockquote or regular paragraph
  const cleanLine = line.replace(/\*\*/g, '').replace(/`/g, '');
  doc.fillColor('#252B27')
     .fontSize(9.5)
     .font(fs.existsSync(fontPath) ? 'Devanagari' : 'Helvetica')
     .text(cleanLine, { lineGap: 2 });
}

// Add page numbering footer
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#718096')
     .fontSize(8)
     .font('Helvetica')
     .text(
       `Sahayata (सहायता) — Technical Design Document | Page ${i + 1} of ${range.count}`,
       45,
       800,
       { align: 'center', width: 505 }
     );
}

doc.end();

writeStream.on('finish', () => {
  console.log(`Successfully generated Technical Design Document PDF at: ${outPdfPath}`);
});
