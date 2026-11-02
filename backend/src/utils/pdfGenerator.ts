import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { config } from '../config';
import { logger } from './logger';

export interface ReceiptPdfData {
  receiptNumber: string;
  certificateNumber: string;
  donorName: string;
  donorEmail: string;
  donorMobile: string;
  donorPAN?: string;
  donorAddress?: string;
  campaignName: string;
  amount: number;
  paymentMode: string;
  transactionReference?: string;
  donationDate: Date;
  donationType: string;
}

const FONT_PATH = path.resolve(__dirname, '../assets/fonts/NotoSansDevanagari-Regular.ttf');
const hasDevanagariFont = fs.existsSync(FONT_PATH);

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
}

function numberToWordsINR(amount: number): string {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Rupees Only';

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      return str;
    }
    if (n > 0) {
      str += single[n] + ' ';
    }
    return str;
  };

  let str = '';
  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;
  const lakh = Math.floor(amount / 100000);
  amount %= 100000;
  const thousand = Math.floor(amount / 1000);
  amount %= 1000;
  const rem = amount;

  if (crore > 0) str += convertGroup(crore) + 'Crore ';
  if (lakh > 0) str += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) str += convertGroup(thousand) + 'Thousand ';
  if (rem > 0) str += convertGroup(rem);

  return str.trim() + ' Rupees Only';
}

/**
 * Generate Official Donation Receipt PDF
 */
export async function generateDonationReceiptPdf(data: ReceiptPdfData): Promise<string> {
  const fileName = `Receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const storageDir = config.pdf.storagePath;
  const filePath = path.join(storageDir, fileName);
  ensureDirectoryExistence(filePath);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      if (hasDevanagariFont) {
        doc.registerFont('Devanagari', FONT_PATH);
      }

      // Forest green top accent bar
      doc.rect(0, 0, 595.28, 12).fill('#245C46');

      // Watermark / Demo Banner
      doc.save();
      doc.rotate(-30, { origin: [300, 400] });
      doc.fontSize(42).fillColor('#E8E5DD').opacity(0.35);
      doc.text('ILLUSTRATIVE DEMO - SAHAYATA', 60, 380, { align: 'center' });
      doc.restore();

      // Header
      doc.moveDown(1.5);
      doc.fillColor('#245C46').fontSize(22).font('Helvetica-Bold');
      doc.text(config.trust.name, { align: 'center' });

      if (hasDevanagariFont) {
        doc.font('Devanagari').fontSize(14).fillColor('#3E4B44');
        doc.text(config.trust.nameHindi, { align: 'center' });
      }

      doc.font('Helvetica').fontSize(9).fillColor('#5A635E');
      doc.text(config.trust.address, { align: 'center' });
      doc.text(`Trust Reg No: ${config.trust.registrationNumber} | Helpline: ${config.trust.helpline}`, { align: 'center' });

      doc.moveDown(0.8);
      doc.strokeColor('#BACFC0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Receipt Title Box
      const receiptY = doc.y;
      doc.rect(50, receiptY, 495, 30).fill('#DCE9DF');
      doc.fillColor('#245C46').fontSize(13).font('Helvetica-Bold');
      doc.text('OFFICIAL DONATION RECEIPT', 50, receiptY + 8, { align: 'center' });
      doc.moveDown(1.8);

      // Meta grid: Receipt No & Date
      const metaY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#252B27');
      doc.text('Receipt No: ', 50, metaY, { continued: true });
      doc.font('Helvetica').fillColor('#245C46').text(data.receiptNumber);

      doc.font('Helvetica-Bold').fillColor('#252B27');
      doc.text('Date of Payment: ', 340, metaY, { continued: true });
      doc.font('Helvetica').text(new Date(data.donationDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }));

      doc.moveDown(1.2);

      // Donor Information Table
      const infoBoxY = doc.y;
      doc.rect(50, infoBoxY, 495, 120).strokeColor('#E8E5DD').lineWidth(1).stroke();

      doc.rect(50, infoBoxY, 495, 24).fill('#FAF9F6');
      doc.fillColor('#245C46').font('Helvetica-Bold').fontSize(10).text('DONOR DETAILS', 60, infoBoxY + 7);

      let currentLineY = infoBoxY + 32;
      const printRow = (label: string, value: string, y: number) => {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#5A635E').text(label, 65, y);
        doc.font('Helvetica').fontSize(9.5).fillColor('#252B27').text(`:  ${value || 'N/A'}`, 170, y);
      };

      printRow('Donor Name', data.donorName, currentLineY);
      printRow('Donor PAN', data.donorPAN || 'Not Provided', currentLineY + 18);
      printRow('Mobile / Email', `${data.donorMobile} / ${data.donorEmail}`, currentLineY + 36);
      printRow('Donor Address', data.donorAddress || 'Madhya Pradesh, India', currentLineY + 54);
      printRow('Donation Type', data.donationType === 'MONTHLY_SIMULATED' ? 'Simulated Monthly Contribution' : 'One-Time Contribution', currentLineY + 72);

      doc.y = infoBoxY + 135;

      // Contribution Particulars Table
      const tableY = doc.y;
      doc.rect(50, tableY, 495, 24).fill('#245C46');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9.5);
      doc.text('DESCRIPTION / CAUSE', 65, tableY + 7);
      doc.text('MODE', 320, tableY + 7);
      doc.text('AMOUNT (INR)', 450, tableY + 7, { align: 'right' });

      const rowY = tableY + 24;
      doc.rect(50, rowY, 495, 45).strokeColor('#E8E5DD').stroke();
      doc.fillColor('#252B27').font('Helvetica').fontSize(9.5);
      doc.text(data.campaignName, 65, rowY + 10, { width: 240 });
      doc.text(data.paymentMode, 320, rowY + 10);
      doc.font('Helvetica-Bold').text(`INR ${data.amount.toLocaleString('en-IN')}.00`, 420, rowY + 10, { width: 110, align: 'right' });

      // In words row
      const wordsY = rowY + 45;
      doc.rect(50, wordsY, 495, 24).fill('#FAF9F6');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#5A635E').text('Amount in Words:', 65, wordsY + 7);
      doc.font('Helvetica').fontSize(9).fillColor('#245C46').text(numberToWordsINR(data.amount), 170, wordsY + 7);

      doc.y = wordsY + 40;

      // Transaction verification footnote
      doc.fontSize(8.5).font('Helvetica').fillColor('#5A635E');
      doc.text(`Payment Gateway Reference: ${data.transactionReference || 'MOCK-TXN-' + Date.now()}`, 50);
      doc.text(`Tax Benefit Certificate Number: ${data.certificateNumber}`, 50);

      // Signatory block
      const sigY = 660;
      doc.strokeColor('#BACFC0').lineWidth(0.5).moveTo(360, sigY).lineTo(530, sigY).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#245C46').text('For Company A Charitable Trust', 360, sigY + 5);
      doc.font('Helvetica').fontSize(8).fillColor('#5A635E').text('Authorized Trustee / Treasurer', 360, sigY + 18);
      doc.text('Bhopal, Madhya Pradesh', 360, sigY + 30);

      // Mandatory Demo Disclaimer
      doc.rect(50, 725, 495, 45).strokeColor('#E9AD65').lineWidth(1).fill('#FFFDF8');
      doc.fillColor('#D08F42').font('Helvetica-Bold').fontSize(8.5);
      doc.text('DEMONSTRATION AND TESTING NOTICE (FICTIONAL CREDENTIALS):', 60, 732);
      doc.font('Helvetica').fontSize(7.5).fillColor('#5A635E');
      doc.text(
        'This receipt is generated as an academic and technical demonstration of the Sahayata donation platform for Company A Charitable Trust. The trust registration and transactions shown herein are simulated and not legally binding financial instruments.',
        60,
        744,
        { width: 475 }
      );

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate 80G Tax Exemption Certificate PDF
 */
export async function generate80GCertificatePdf(data: ReceiptPdfData): Promise<string> {
  const fileName = `Certificate80G_${data.certificateNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const storageDir = config.pdf.storagePath;
  const filePath = path.join(storageDir, fileName);
  ensureDirectoryExistence(filePath);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      if (hasDevanagariFont) {
        doc.registerFont('Devanagari', FONT_PATH);
      }

      // Double decorative border
      doc.rect(25, 25, 545.28, 791.89).strokeColor('#245C46').lineWidth(2).stroke();
      doc.rect(30, 30, 535.28, 781.89).strokeColor('#BACFC0').lineWidth(0.8).stroke();

      // Watermark / Demo Banner
      doc.save();
      doc.rotate(-35, { origin: [300, 420] });
      doc.fontSize(38).fillColor('#E8E5DD').opacity(0.35);
      doc.text('SIMULATED 80G CERTIFICATE - DEMO', 20, 390, { align: 'center' });
      doc.restore();

      // Header
      doc.moveDown(1.2);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#245C46').text(config.trust.name, { align: 'center' });

      if (hasDevanagariFont) {
        doc.font('Devanagari').fontSize(13).fillColor('#3E4B44').text(config.trust.nameHindi, { align: 'center' });
      }

      doc.font('Helvetica').fontSize(8.5).fillColor('#5A635E');
      doc.text(config.trust.address, { align: 'center' });
      doc.text(`Trust PAN: ${config.trust.pan} | Email: ${config.trust.email}`, { align: 'center' });

      doc.moveDown(0.6);
      doc.strokeColor('#245C46').lineWidth(1).moveTo(60, doc.y).lineTo(535, doc.y).stroke();
      doc.moveDown(0.8);

      // Certificate Title Header
      doc.rect(60, doc.y, 475, 42).fill('#245C46');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13);
      doc.text('CERTIFICATE OF DONATION FOR TAX EXEMPTION', 60, doc.y - 34, { align: 'center' });
      doc.fontSize(9.5).font('Helvetica');
      doc.text('[ Under Section 80G(5)(vi) of the Income Tax Act, 1961 ]', 60, doc.y + 4, { align: 'center' });

      doc.moveDown(2);

      // 80G Approval Box
      const approvalY = doc.y;
      doc.rect(60, approvalY, 475, 46).fill('#FAF9F6').strokeColor('#DCE9DF').lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#245C46');
      doc.text(`80G Registration No: ${config.trust.eightyGNumber}`, 75, approvalY + 8);
      doc.font('Helvetica').fillColor('#5A635E');
      doc.text(`Approval Validity: ${config.trust.eightyGValidity}`, 75, approvalY + 22);
      doc.text(`Jurisdiction: Office of Commissioner of Income Tax (Exemption), Bhopal`, 75, approvalY + 34);

      doc.y = approvalY + 60;

      // Meta Info
      const certMetaY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#252B27');
      doc.text('Certificate No: ', 60, certMetaY, { continued: true });
      doc.font('Helvetica').fillColor('#245C46').text(data.certificateNumber);

      doc.font('Helvetica-Bold').fillColor('#252B27');
      doc.text('Donation Receipt Ref: ', 330, certMetaY, { continued: true });
      doc.font('Helvetica').text(data.receiptNumber);

      doc.moveDown(1.2);

      // Certificate Body Text
      doc.font('Helvetica').fontSize(10).fillColor('#252B27').lineGap(4);
      doc.text(
        `This is to certify that Company A Charitable Trust has received with gratitude a voluntary contribution as detailed below:`,
        60
      );

      doc.moveDown(0.8);

      // Donor & Donation Summary Table
      const tableY = doc.y;
      doc.rect(60, tableY, 475, 140).strokeColor('#BACFC0').lineWidth(1).stroke();

      const printCertRow = (label: string, val: string, y: number, isAlt = false) => {
        if (isAlt) {
          doc.rect(60, y, 475, 23).fill('#FAF9F6');
        }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#5A635E').text(label, 75, y + 6);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#252B27').text(`:  ${val}`, 210, y + 6);
      };

      printCertRow('Name of Donor', data.donorName, tableY, true);
      printCertRow('Permanent Account Number (PAN)', data.donorPAN || 'NOT AVAILABLE (Form 60/61 applicable)', tableY + 23);
      printCertRow('Address of Donor', data.donorAddress || 'Madhya Pradesh, India', tableY + 46, true);
      printCertRow('Date of Contribution', new Date(data.donationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), tableY + 69);
      printCertRow('Amount Contributed', `INR ${data.amount.toLocaleString('en-IN')}.00`, tableY + 92, true);
      printCertRow('Amount in Words', numberToWordsINR(data.amount), tableY + 115);

      doc.y = tableY + 155;

      // 80G Statutory Declaration
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#245C46');
      doc.text('Statutory Declaration under Rule 18AB:', 60);
      doc.font('Helvetica').fontSize(8.5).fillColor('#3E4B44').lineGap(2);
      doc.text(
        '1. Donations made to Company A Charitable Trust are eligible for 50% deduction from taxable income under Section 80G of the Income Tax Act, 1961.\n' +
        '2. This donation has been received as a voluntary contribution towards charitable objectives in women empowerment, livelihoods, and health.\n' +
        '3. Information of this donation will be reported in Statement of Donation in Form 10BD to the Director General of Income Tax (Systems).',
        60
      );

      // Signatory
      const certSigY = 660;
      doc.strokeColor('#BACFC0').lineWidth(0.5).moveTo(360, certSigY).lineTo(520, certSigY).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#245C46').text('For Company A Charitable Trust', 360, certSigY + 5);
      doc.font('Helvetica').fontSize(8).fillColor('#5A635E').text('Managing Trustee / Authorized Signatory', 360, certSigY + 18);
      doc.text('Bhopal (M.P.)', 360, certSigY + 30);

      // Mandatory Demo Disclaimer
      doc.rect(60, 725, 475, 45).strokeColor('#E9AD65').lineWidth(1).fill('#FFFDF8');
      doc.fillColor('#D08F42').font('Helvetica-Bold').fontSize(8.5);
      doc.text('ILLUSTRATIVE DEMO NOTICE — NOT A VALID TAX CERTIFICATE:', 70, 732);
      doc.font('Helvetica').fontSize(7.5).fillColor('#5A635E');
      doc.text(
        'This 80G certificate is an illustrative sample generated exclusively for software engineering assessment evaluation. Fictional registration numbers are used. Do not submit to the Income Tax Department or claim actual tax deductions using this simulated document.',
        70,
        744,
        { width: 455 }
      );

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
