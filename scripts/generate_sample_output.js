import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateSamplePackage() {
  const tender = {
    tender_id: "T-2026-0417",
    title: "Supply of IT Equipment and Networking Hardware",
    procuring_entity: "Directorate General of Information Technology",
    bidder: "Apex Tech Solutions Ltd.",
    submission_deadline: "2026-10-20"
  };

  const docs = [
    { order: 1, id: "R01", title: "Trade License", pages: 2, file: "Trade_License_2026.pdf" },
    { order: 2, id: "R02", title: "Tax Identification & Clearance Certificate", pages: 1, file: "Tax_Clearance_FY2025.pdf" },
    { order: 3, id: "R03", title: "VAT Registration Certificate", pages: 1, file: "VAT_Registration_Bin.pdf" },
    { order: 4, id: "R04", title: "Bank Solvency Certificate", pages: 2, file: "Bank_Solvency_Letter.pdf" },
    { order: 5, id: "R05", title: "Manufacturer Authorization Form (MAF)", pages: 3, file: "Manufacturer_Authorization_MAF.pdf" },
    { order: 6, id: "R06", title: "Audited Financial Statements", pages: 4, file: "Audit_Financial_Report.pdf" },
    { order: 7, id: "R07", title: "ISO 9001:2015 Quality Certificate", pages: 1, file: "ISO_9001_Quality_Cert.pdf" },
  ];

  const mergedPdf = await PDFDocument.create();
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Cover Page
  const coverPage = mergedPdf.addPage([595.28, 841.89]);
  const { width: coverWidth, height: coverHeight } = coverPage.getSize();

  const navy = rgb(0.08, 0.18, 0.36);
  const darkGray = rgb(0.2, 0.25, 0.3);
  const lightGray = rgb(0.92, 0.94, 0.96);
  const borderCol = rgb(0.8, 0.84, 0.9);
  const accentBlue = rgb(0.14, 0.38, 0.92);

  // Header Banner
  coverPage.drawRectangle({
    x: 40,
    y: coverHeight - 80,
    width: coverWidth - 80,
    height: 44,
    color: navy,
  });

  coverPage.drawText('OFFICIAL TENDER SUBMISSION PACKAGE', {
    x: 55,
    y: coverHeight - 54,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  coverPage.drawText('COMPLIANT BID DOCUMENTATION', {
    x: 55,
    y: coverHeight - 70,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.88, 1),
  });

  // Metadata Card
  const metaY = coverHeight - 100;
  const cardHeight = 165;
  coverPage.drawRectangle({
    x: 40,
    y: metaY - cardHeight,
    width: coverWidth - 80,
    height: cardHeight,
    color: lightGray,
    borderColor: borderCol,
    borderWidth: 1,
  });

  const metadataItems = [
    ['Tender ID:', tender.tender_id],
    ['Tender Title:', tender.title],
    ['Procuring Entity:', tender.procuring_entity],
    ['Bidder Name:', tender.bidder],
    ['Submission Deadline:', tender.submission_deadline],
    ['Package Generated At:', new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })],
  ];

  let currentMetaY = metaY - 25;
  for (const [label, val] of metadataItems) {
    coverPage.drawText(label, { x: 55, y: currentMetaY, size: 9.5, font: fontBold, color: navy });
    const safeVal = val.length > 55 ? val.substring(0, 52) + '...' : val;
    coverPage.drawText(safeVal, { x: 185, y: currentMetaY, size: 9.5, font: fontRegular, color: darkGray });
    currentMetaY -= 22;
  }

  // TOC Table
  const tableTopY = metaY - cardHeight - 25;
  coverPage.drawText('INCLUDED DOCUMENTS / TABLE OF CONTENTS', {
    x: 40,
    y: tableTopY,
    size: 12,
    font: fontBold,
    color: navy,
  });

  coverPage.drawText(`Total documents included: ${docs.length}`, {
    x: 40,
    y: tableTopY - 14,
    size: 8.5,
    font: fontRegular,
    color: darkGray,
  });

  const thY = tableTopY - 32;
  coverPage.drawRectangle({
    x: 40,
    y: thY - 4,
    width: coverWidth - 80,
    height: 20,
    color: rgb(0.9, 0.93, 0.97),
  });

  coverPage.drawText('Order', { x: 48, y: thY + 2, size: 8, font: fontBold, color: navy });
  coverPage.drawText('Requirement / Title', { x: 85, y: thY + 2, size: 8, font: fontBold, color: navy });
  coverPage.drawText('Filename', { x: 275, y: thY + 2, size: 8, font: fontBold, color: navy });
  coverPage.drawText('Pages', { x: 440, y: thY + 2, size: 8, font: fontBold, color: navy });
  coverPage.drawText('Starts At', { x: 495, y: thY + 2, size: 8, font: fontBold, color: navy });

  let runningPageNumber = 2;
  let rowY = thY - 22;

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];
    if (idx % 2 === 1) {
      coverPage.drawRectangle({
        x: 40,
        y: rowY - 4,
        width: coverWidth - 80,
        height: 18,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    coverPage.drawText(String(doc.order), { x: 55, y: rowY, size: 8, font: fontRegular, color: darkGray });
    coverPage.drawText(`${doc.id}: ${doc.title}`, { x: 85, y: rowY, size: 8, font: fontBold, color: darkGray });
    coverPage.drawText(doc.file, { x: 275, y: rowY, size: 7.5, font: fontRegular, color: darkGray });
    coverPage.drawText(String(doc.pages), { x: 450, y: rowY, size: 8, font: fontRegular, color: darkGray });
    coverPage.drawText(`Page ${runningPageNumber}`, { x: 495, y: rowY, size: 8, font: fontBold, color: accentBlue });

    rowY -= 18;
    runningPageNumber += doc.pages;
  }

  // Create document pages for each doc
  for (const doc of docs) {
    for (let p = 0; p < doc.pages; p++) {
      const page = mergedPdf.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      page.drawRectangle({
        x: 35,
        y: 40,
        width: width - 70,
        height: height - 80,
        borderColor: rgb(0.85, 0.88, 0.92),
        borderWidth: 1,
      });

      page.drawText(`DOCUMENT ATTACHMENT: ${doc.title.toUpperCase()}`, {
        x: 55,
        y: height - 70,
        size: 13,
        font: fontBold,
        color: navy,
      });

      page.drawText(`Requirement ID: ${doc.id} | File: ${doc.file} | Section Sheet ${p + 1} of ${doc.pages}`, {
        x: 55,
        y: height - 88,
        size: 9,
        font: fontRegular,
        color: darkGray,
      });

      page.drawText(`[Official Bid Attachment Content for ${doc.title} - Certified Compliant]`, {
        x: 55,
        y: height - 140,
        size: 10,
        font: fontRegular,
        color: darkGray,
      });
    }
  }

  // Apply footers
  const totalPages = mergedPdf.getPageCount();
  const pages = mergedPdf.getPages();

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width: pWidth } = page.getSize();
    const footerText = `${tender.tender_id} | Page ${i + 1} of ${totalPages}`;
    const fontSize = 8.5;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, fontSize);

    page.drawRectangle({
      x: 20,
      y: 10,
      width: pWidth - 40,
      height: 18,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.9, 0.92, 0.95),
      borderWidth: 0.5,
    });

    page.drawText(footerText, {
      x: (pWidth - textWidth) / 2,
      y: 15,
      size: fontSize,
      font: fontBold,
      color: navy,
    });
  }

  const pdfBytes = await mergedPdf.save();
  const outDir = path.resolve('output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFilePath = path.join(outDir, `${tender.tender_id}_Package.pdf`);
  fs.writeFileSync(outFilePath, Buffer.from(pdfBytes));
  console.log(`Successfully generated: ${outFilePath} (${totalPages} pages)`);
}

generateSamplePackage();
