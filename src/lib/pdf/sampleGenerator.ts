import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates dummy sample PDF File objects in browser for testing the builder.
 */
export async function createSamplePdfFile(
  fileName: string,
  docTitle: string,
  pageCount: number = 2,
  overrideContent?: string
): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.2, 0.4, 0.7),
      borderWidth: 1.5,
    });

    // Header
    page.drawText(docTitle.toUpperCase(), {
      x: 50,
      y: height - 80,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText(`Page ${i + 1} of ${pageCount}`, {
      x: 50,
      y: height - 105,
      size: 10,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Content text
    const content = overrideContent || 
      `This is official documentary evidence provided for tender verification.
Document: ${docTitle}
File Reference: ${fileName}
Authentication hash verification payload: ${docTitle} - Section ${i + 1}`;

    page.drawText(content, {
      x: 50,
      y: height - 160,
      size: 11,
      font: fontRegular,
      color: rgb(0.15, 0.15, 0.15),
      lineHeight: 18,
    });

    // Watermark/Notice
    page.drawText('OFFICIAL VERIFIED COPY — CONFIDENTIAL BID ATTACHMENT', {
      x: 50,
      y: 60,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes as unknown as BlobPart], fileName, { type: 'application/pdf' });
}

export async function createDuplicateSamplePair(): Promise<{ original: File; duplicate: File }> {
  const original = await createSamplePdfFile(
    'Trade_License_Original.pdf',
    'Official Trade License 2026',
    2,
    'EXACT_MATCHING_CONTENT_HASH_VERIFICATION_TOKEN_89234'
  );
  
  // Clone original bytes exactly with different filename
  const bytes = await original.arrayBuffer();
  const duplicate = new File([bytes], 'Trade_License_Scanned_Copy_Rename.pdf', {
    type: 'application/pdf',
  });

  return { original, duplicate };
}
