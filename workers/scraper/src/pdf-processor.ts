import pdfParse from 'pdf-parse';
import { isAllowedNuUrl, normalizeText, sha256Hex } from '@np-nu/shared';

export interface PdfExtractionResult {
  sha256Hash: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number | null;
  extractedText: string | null;
  extractionStatus: 'extracted' | 'ocr_required' | 'failed';
}

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export async function extractPdfFromBuffer(buffer: Buffer): Promise<PdfExtractionResult> {
  const sha256Hash = sha256Hex(buffer);
  try {
    const parsed = await pdfParse(buffer);
    const cleaned = normalizeText(parsed.text ?? '');
    const isImageOnly = cleaned.length < 40;
    return {
      sha256Hash,
      mimeType: 'application/pdf',
      fileSizeBytes: buffer.length,
      pageCount: parsed.numpages ?? null,
      extractedText: isImageOnly ? null : cleaned.slice(0, 100000),
      extractionStatus: isImageOnly ? 'ocr_required' : 'extracted',
    };
  } catch {
    return {
      sha256Hash,
      mimeType: 'application/pdf',
      fileSizeBytes: buffer.length,
      pageCount: null,
      extractedText: null,
      extractionStatus: 'failed',
    };
  }
}

export async function downloadAndProcessPdf(
  pdfUrl: string,
  userAgent: string,
  timeoutMs = 15000
): Promise<PdfExtractionResult> {
  if (!isAllowedNuUrl(pdfUrl)) {
    throw new Error(`Disallowed PDF domain: ${pdfUrl}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching PDF`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('pdf') && !pdfUrl.toLowerCase().includes('.pdf')) {
      throw new Error(`Unexpected MIME type: ${contentType}`);
    }
    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > MAX_PDF_BYTES) {
      throw new Error(`PDF exceeds max limit (${arrayBuf.byteLength} bytes)`);
    }
    return await extractPdfFromBuffer(Buffer.from(arrayBuf));
  } finally {
    clearTimeout(timer);
  }
}
