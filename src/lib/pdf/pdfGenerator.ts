import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Tender, RequirementValidationResult } from '../../types';

export interface PDFGenerationProgress {
  currentStep: string;
  percent: number;
}

export interface PDFGenerationOptions {
  includeIndexPage?: boolean;
  sealImageBytes?: Uint8Array;
  sealApplyTo?: 'all' | 'last' | 'cover';
  onProgress?: (progress: PDFGenerationProgress) => void;
}

/**
 * Builds the official submission-ready PDF package according to Section 6 of SRS.
 */
export async function generateTenderPackage(
  tender: Tender,
  validationResults: RequirementValidationResult[],
  options: PDFGenerationOptions = {}
): Promise<{ pdfBytes: Uint8Array; fileName: string; totalPages: number }> {
  const { onProgress } = options;

  onProgress?.({ currentStep: 'Initializing document package...', percent: 10 });

  const mergedPdf = await PDFDocument.create();
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Filter only matched documents sorted by requirement order
  const includedDocs = validationResults
    .filter(res => res.matchedFile)
    .sort((a, b) => a.requirement.order - b.requirement.order);

  // Create English Cover Page (Page 1)
  onProgress?.({ currentStep: 'Generating English cover page...', percent: 25 });
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4 in points
  const { width: coverWidth, height: coverHeight } = coverPage.getSize();

  // Colors
  const navy = rgb(0.08, 0.18, 0.36);
  const darkGray = rgb(0.2, 0.25, 0.3);
  const lightGray = rgb(0.92, 0.94, 0.96);
  const borderCol = rgb(0.8, 0.84, 0.9);
  const accentBlue = rgb(0.14, 0.38, 0.92);

  // Top Decorative Header Banner
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

  // Tender Metadata Card
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

  const metadataItems: [string, string][] = [
    ['Tender ID:', tender.tender_id],
    ['Tender Title:', tender.title],
    ['Procuring Entity:', tender.procuring_entity],
    ['Bidder Name:', tender.bidder],
    ['Submission Deadline:', tender.submission_deadline],
    ['Package Generated At:', new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })],
  ];

  let currentMetaY = metaY - 25;
  for (const [label, val] of metadataItems) {
    coverPage.drawText(label, {
      x: 55,
      y: currentMetaY,
      size: 9.5,
      font: fontBold,
      color: navy,
    });
    // Truncate long value if needed
    const safeVal = val.length > 55 ? val.substring(0, 52) + '...' : val;
    coverPage.drawText(safeVal, {
      x: 185,
      y: currentMetaY,
      size: 9.5,
      font: fontRegular,
      color: darkGray,
    });
    currentMetaY -= 22;
  }

  // Included Documents Table Section Header
  const tableTopY = metaY - cardHeight - 25;
  coverPage.drawText('INCLUDED DOCUMENTS / TABLE OF CONTENTS', {
    x: 40,
    y: tableTopY,
    size: 12,
    font: fontBold,
    color: navy,
  });

  coverPage.drawText(`Total documents included: ${includedDocs.length}`, {
    x: 40,
    y: tableTopY - 14,
    size: 8.5,
    font: fontRegular,
    color: darkGray,
  });

  // Table header
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

  // Pre-calculate page starts
  // Cover page is Page 1.
  let runningPageNumber = 2; // Document 1 starts on Page 2
  const docStartPages: number[] = [];

  for (const doc of includedDocs) {
    docStartPages.push(runningPageNumber);
    runningPageNumber += (doc.matchedFile?.pageCount || 1);
  }

  let rowY = thY - 22;
  includedDocs.forEach((doc, idx) => {
    if (rowY > 75) {
      // Row stripe
      if (idx % 2 === 1) {
        coverPage.drawRectangle({
          x: 40,
          y: rowY - 4,
          width: coverWidth - 80,
          height: 18,
          color: rgb(0.97, 0.98, 0.99),
        });
      }

      coverPage.drawText(String(doc.requirement.order), { x: 55, y: rowY, size: 8, font: fontRegular, color: darkGray });
      
      const title = doc.requirement.title_en.length > 30 
        ? doc.requirement.title_en.substring(0, 28) + '...'
        : doc.requirement.title_en;
      coverPage.drawText(`${doc.requirement.id}: ${title}`, { x: 85, y: rowY, size: 8, font: fontBold, color: darkGray });

      const fileName = (doc.matchedFile?.name || '').length > 28
        ? (doc.matchedFile?.name || '').substring(0, 26) + '...'
        : (doc.matchedFile?.name || '');
      coverPage.drawText(fileName, { x: 275, y: rowY, size: 7.5, font: fontRegular, color: darkGray });

      coverPage.drawText(String(doc.matchedFile?.pageCount || 1), { x: 450, y: rowY, size: 8, font: fontRegular, color: darkGray });
      coverPage.drawText(`Page ${docStartPages[idx]}`, { x: 495, y: rowY, size: 8, font: fontBold, color: accentBlue });

      rowY -= 18;
    }
  });

  // Embed seal image if provided
  let embeddedSealImage: any = null;
  if (options.sealImageBytes) {
    try {
      embeddedSealImage = await mergedPdf.embedPng(options.sealImageBytes);
    } catch {
      // If not PNG, try JPEG
      try {
        embeddedSealImage = await mergedPdf.embedJpg(options.sealImageBytes);
      } catch (e) {
        console.warn('Seal could not be embedded:', e);
      }
    }
  }

  // Append included PDF files
  const totalDocs = includedDocs.length;
  for (let idx = 0; idx < totalDocs; idx++) {
    const doc = includedDocs[idx];
    const file = doc.matchedFile!;
    const percent = Math.floor(30 + ((idx + 1) / totalDocs) * 50);

    onProgress?.({
      currentStep: `Merging document ${idx + 1}/${totalDocs}: ${file.name}...`,
      percent,
    });

    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (mergeErr) {
      console.error(`Failed to copy pages for ${file.name}:`, mergeErr);
      // Create fallback page for corrupted document
      const fallbackPage = mergedPdf.addPage([595.28, 841.89]);
      fallbackPage.drawText(`[Document Error: Unable to read pages for ${file.name}]`, {
        x: 50,
        y: 400,
        size: 12,
        font: fontBold,
        color: rgb(0.8, 0.1, 0.1),
      });
    }
  }

  // Stamp Footers on EVERY page (including Cover)
  // Section 6: "<tender_id> | Page X of Y on every page, including cover."
  // "Footer must be readable and must not cover document content."
  onProgress?.({ currentStep: 'Adding standard footers to all pages...', percent: 85 });

  const totalPageCount = mergedPdf.getPageCount();
  const pages = mergedPdf.getPages();

  for (let i = 0; i < totalPageCount; i++) {
    const page = pages[i];
    const { width: pWidth } = page.getSize();
    const footerText = `${tender.tender_id} | Page ${i + 1} of ${totalPageCount}`;
    const fontSize = 8.5;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, fontSize);

    // Subtle safety backing strip at bottom margin (y: 10 to 28)
    page.drawRectangle({
      x: 20,
      y: 10,
      width: pWidth - 40,
      height: 18,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.9, 0.92, 0.95),
      borderWidth: 0.5,
      opacity: 0.92,
    });

    // Draw Footer Text centered
    page.drawText(footerText, {
      x: (pWidth - textWidth) / 2,
      y: 15,
      size: fontSize,
      font: fontBold,
      color: navy,
    });

    // Apply seal if applicable
    if (embeddedSealImage) {
      const apply = options.sealApplyTo || 'all';
      const shouldApply =
        apply === 'all' ||
        (apply === 'cover' && i === 0) ||
        (apply === 'last' && i === totalPageCount - 1);

      if (shouldApply) {
        const sealDims = embeddedSealImage.scale(0.18);
        page.drawImage(embeddedSealImage, {
          x: pWidth - sealDims.width - 35,
          y: 35,
          width: sealDims.width,
          height: sealDims.height,
          opacity: 0.85,
        });
      }
    }
  }

  onProgress?.({ currentStep: 'Finalizing PDF output package...', percent: 95 });

  const pdfBytes = await mergedPdf.save();
  const fileName = `${tender.tender_id}_Package.pdf`;

  onProgress?.({ currentStep: 'Package generated successfully!', percent: 100 });

  return {
    pdfBytes,
    fileName,
    totalPages: totalPageCount,
  };
}

/**
 * Initiates browser download of the generated PDF file.
 */
export function downloadGeneratedPDF(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}
