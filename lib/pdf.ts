import { CONFIG } from './config';

export interface ExtractedPdfResult {
  success: boolean;
  text: string;
  pageCount: number;
  errorMessage?: string;
  isManualReview?: boolean;
}

/**
 * Configure PDF.js worker options safely in the browser.
 */
let workerConfigured = false;
async function ensureWorkerConfigured() {
  if (typeof window === 'undefined' || workerConfigured) {
    return;
  }
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Point to public/pdf.worker.min.js copied during build/scaffold
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    workerConfigured = true;
  } catch (err) {
    console.warn('Could not configure PDF.js worker via public asset, relying on fallback', err);
  }
}

/**
 * Client-side PDF text extraction and validation.
 *
 * Enforces:
 * - File size <= 2 MB
 * - PDF format validity
 * - Decryption check (encrypted PDFs rejected)
 * - Page count <= 10
 * - Text sufficiency heuristic (>= 100 characters of readable text)
 *
 * If any constraint fails, flags the file for manual_review without a candidate score,
 * allowing other candidates in the batch to proceed.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedPdfResult> {
  // 1. File size check
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      text: '',
      pageCount: 0,
      isManualReview: true,
      errorMessage: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 2 MB limit.`,
    };
  }

  // 2. MIME / Extension check
  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return {
      success: false,
      text: '',
      pageCount: 0,
      isManualReview: true,
      errorMessage: 'Invalid file format. Only PDF files are supported.',
    };
  }

  try {
    await ensureWorkerConfigured();
    const pdfjsLib = await import('pdfjs-dist');

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    // 3. Page count limit check
    if (pageCount > CONFIG.MAX_PAGES_PER_PDF) {
      return {
        success: false,
        text: '',
        pageCount,
        isManualReview: true,
        errorMessage: `PDF has ${pageCount} pages, exceeding the 10-page limit.`,
      };
    }

    // 4. Extract text from each page
    const textPieces: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      if (pageText.trim()) {
        textPieces.push(pageText.trim());
      }
    }

    const fullExtractedText = textPieces.join('\n\n').trim();

    // 5. Text sufficiency heuristic check
    if (fullExtractedText.length < CONFIG.MIN_READABLE_TEXT_CHARS) {
      return {
        success: false,
        text: fullExtractedText,
        pageCount,
        isManualReview: true,
        errorMessage: `Insufficient extractable text (${fullExtractedText.length} chars). File may be a scanned image or empty. Only text-based PDFs are supported.`,
      };
    }

    return {
      success: true,
      text: fullExtractedText,
      pageCount,
    };
  } catch (error: any) {
    // Check for password protection / encrypted document
    if (error?.name === 'PasswordException' || error?.message?.includes('password')) {
      return {
        success: false,
        text: '',
        pageCount: 0,
        isManualReview: true,
        errorMessage: 'PDF is password-protected or encrypted. Please remove password protection.',
      };
    }

    return {
      success: false,
      text: '',
      pageCount: 0,
      isManualReview: true,
      errorMessage: `Could not read PDF: ${error?.message || 'Corrupted or unreadable format'}.`,
    };
  }
}
