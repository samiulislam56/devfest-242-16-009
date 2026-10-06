import { PDFDocument } from 'pdf-lib';

export interface PDFInspectionResult {
  pageCount: number;
  isEncrypted: boolean;
  isCorrupted: boolean;
  errorMessage?: string;
}

/**
 * Inspects a PDF file in browser to determine page count and detect encryption/corruption.
 */
export async function inspectPDFFile(file: File): Promise<PDFInspectionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Check minimum size or PDF magic header %PDF-
    if (arrayBuffer.byteLength < 5) {
      return {
        pageCount: 0,
        isEncrypted: false,
        isCorrupted: true,
        errorMessage: 'Invalid or empty PDF file.'
      };
    }

    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: false,
        updateMetadata: false
      });
      const count = pdfDoc.getPageCount();
      return {
        pageCount: count,
        isEncrypted: false,
        isCorrupted: false
      };
    } catch (innerErr: unknown) {
      const errString = String(innerErr).toLowerCase();
      if (errString.includes('encrypted') || errString.includes('password')) {
        return {
          pageCount: 0,
          isEncrypted: true,
          isCorrupted: false,
          errorMessage: 'File is password-protected or encrypted.'
        };
      }
      return {
        pageCount: 0,
        isEncrypted: false,
        isCorrupted: true,
        errorMessage: innerErr instanceof Error ? innerErr.message : 'Corrupted or unreadable PDF.'
      };
    }
  } catch (err: unknown) {
    return {
      pageCount: 0,
      isEncrypted: false,
      isCorrupted: true,
      errorMessage: err instanceof Error ? err.message : 'Could not read PDF file.'
    };
  }
}
