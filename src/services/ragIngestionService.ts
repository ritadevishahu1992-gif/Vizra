import {
  RAGChunk,
  RAGChunkMetadata,
  RAGDocument,
  SupportedFileType,
  SupportedMimeType,
  KnowledgeTier,
  AccessLevel,
} from '../types/rag';

// Default chunking constants per OMNIA 1.0 Specification v1.0
export const CHUNK_CONFIG = {
  CHUNK_SIZE_TOKENS: 512,
  OVERLAP_TOKENS: 64,
  MIN_CHUNK_TOKENS: 100,
  MAX_CHUNK_TOKENS: 1024,
  // Approximate conversion: 1 token ~= 4 characters in English
  CHARS_PER_TOKEN: 4,
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
};

export class IngestionError extends Error {
  code: 'UNSUPPORTED_MEDIA_TYPE' | 'CORRUPTED_FILE_PAYLOAD' | 'FILE_TOO_LARGE' | 'EMPTY_FILE';

  constructor(
    code: 'UNSUPPORTED_MEDIA_TYPE' | 'CORRUPTED_FILE_PAYLOAD' | 'FILE_TOO_LARGE' | 'EMPTY_FILE',
    message: string
  ) {
    super(message);
    this.name = 'IngestionError';
    this.code = code;
  }
}

/**
 * Fast, deterministic cryptographic-style hash (FNV-1a / Murmur hybrid) for deduplication
 */
export function computeContentHash(text: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const fullHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  return `hash_${fullHex}`;
}

/**
 * Approximate token count from text using word/subword boundaries
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard approximation: words * 1.3 or length / 4
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length * 1.25));
}

/**
 * Detects supported MIME types and validates file integrity
 */
export function detectAndValidateFile(
  fileName: string,
  fileSize: number,
  mimeType?: string
): { fileType: SupportedFileType; mime: SupportedMimeType } {
  if (fileSize > CHUNK_CONFIG.MAX_FILE_SIZE_BYTES) {
    throw new IngestionError(
      'FILE_TOO_LARGE',
      `File size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed 25MB.`
    );
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const extMap: Record<string, { fileType: SupportedFileType; mime: SupportedMimeType }> = {
    txt: { fileType: 'txt', mime: 'text/plain' },
    md: { fileType: 'md', mime: 'text/markdown' },
    markdown: { fileType: 'md', mime: 'text/markdown' },
    pdf: { fileType: 'pdf', mime: 'application/pdf' },
    docx: {
      fileType: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    csv: { fileType: 'csv', mime: 'text/csv' },
    json: { fileType: 'json', mime: 'application/json' },
  };

  const detected = extMap[ext];
  if (!detected) {
    throw new IngestionError(
      'UNSUPPORTED_MEDIA_TYPE',
      `File extension '.${ext}' is unsupported. Allowed formats: TXT, Markdown (.md), PDF, DOCX, CSV, JSON.`
    );
  }

  return detected;
}

/**
 * Extracts and cleans text from various payloads
 */
export function extractAndCleanText(
  fileContent: string,
  fileType: SupportedFileType
): string {
  if (!fileContent || typeof fileContent !== 'string') {
    throw new IngestionError('EMPTY_FILE', 'File payload contains no readable text or is empty.');
  }

  let text = fileContent;

  if (fileType === 'json') {
    try {
      const parsed = JSON.parse(fileContent);
      text = formatJsonForRAG(parsed);
    } catch {
      throw new IngestionError(
        'CORRUPTED_FILE_PAYLOAD',
        'JSON file payload could not be parsed. Ensure valid JSON syntax.'
      );
    }
  } else if (fileType === 'csv') {
    try {
      text = formatCsvForRAG(fileContent);
    } catch {
      throw new IngestionError(
        'CORRUPTED_FILE_PAYLOAD',
        'CSV file payload is malformed or unreadable.'
      );
    }
  }

  // Text cleaning:
  // 1. Remove null bytes and non-printable control characters (except newline, tab)
  const cleaned = text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 2. Normalize carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 3. Normalize excessive vertical whitespace
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  if (!cleaned) {
    throw new IngestionError('EMPTY_FILE', 'Extracted content is empty after cleaning.');
  }

  return cleaned;
}

/**
 * Converts structured JSON into semantic readable markdown text for indexing
 */
function formatJsonForRAG(data: any, depth = 0): string {
  if (data === null || data === undefined) return '';
  if (typeof data !== 'object') return String(data);

  if (Array.isArray(data)) {
    return data
      .map((item, idx) => `Item ${idx + 1}:\n${formatJsonForRAG(item, depth + 1)}`)
      .join('\n\n');
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    const formattedKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim();
    if (typeof value === 'object' && value !== null) {
      lines.push(`### ${formattedKey}\n${formatJsonForRAG(value, depth + 1)}`);
    } else {
      lines.push(`- **${formattedKey}**: ${value}`);
    }
  }
  return lines.join('\n');
}

/**
 * Formats CSV rows into semantic markdown table/records for precise RAG retrieval
 */
function formatCsvForRAG(csvText: string): string {
  const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';

  const headers = parseCsvLine(lines[0]);
  if (headers.length === 0) return csvText;

  const records: string[] = [];
  records.push(`### Dataset Table Columns: ${headers.join(', ')}\n`);

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0) continue;
    const recordLines = row
      .map((val, idx) => {
        const h = headers[idx] || `Column ${idx + 1}`;
        return `- **${h}**: ${val}`;
      })
      .join('\n');
    records.push(`#### Record #${i}\n${recordLines}`);
  }

  return records.join('\n\n');
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  result.push(curr.trim());
  return result;
}

/**
 * Semantic Hierarchy Chunking Engine
 * Splits by markdown headings (#, ##, ###), code blocks, paragraphs, and list blocks.
 * Enforces:
 * - Chunk size: ~512 tokens (~2000 chars)
 * - Overlap: ~64 tokens (~250 chars)
 * - Min: 100 tokens, Max: 1024 tokens
 */
export function semanticChunkDocument(
  text: string,
  fileName: string,
  docOptions: {
    documentId: string;
    workspaceId: string;
    projectId: string;
    sourceType: RAGChunkMetadata['source_type'];
    accessLevel: AccessLevel;
  }
): RAGChunk[] {
  const targetChars = CHUNK_CONFIG.CHUNK_SIZE_TOKENS * CHUNK_CONFIG.CHARS_PER_TOKEN; // 2048 chars
  const overlapChars = CHUNK_CONFIG.OVERLAP_TOKENS * CHUNK_CONFIG.CHARS_PER_TOKEN; // 256 chars
  const minChars = CHUNK_CONFIG.MIN_CHUNK_TOKENS * CHUNK_CONFIG.CHARS_PER_TOKEN; // 400 chars
  const maxChars = CHUNK_CONFIG.MAX_CHUNK_TOKENS * CHUNK_CONFIG.CHARS_PER_TOKEN; // 4096 chars

  // Split into structural sections preserving headings
  const rawSections = splitByHeadingsAndParagraphs(text);
  const chunks: RAGChunk[] = [];
  let chunkCounter = 1;
  const now = new Date().toISOString();

  let currentBuffer = '';
  let currentSection = 'Introduction / Overview';
  let previousOverlap = '';

  for (const section of rawSections) {
    if (section.heading) {
      currentSection = section.heading;
    }

    const candidateText = (currentBuffer ? currentBuffer + '\n\n' : '') + section.content;

    if (candidateText.length > maxChars) {
      // Current buffer already has content, flush it
      if (currentBuffer.length >= minChars) {
        chunks.push(
          createChunk({
            id: `chk_${docOptions.documentId.slice(-6)}_${String(chunkCounter++).padStart(4, '0')}`,
            text: currentBuffer.trim(),
            section: currentSection,
            fileName,
            now,
            docOptions,
          })
        );
        previousOverlap = currentBuffer.slice(-overlapChars);
      }

      // If this single section alone exceeds maxChars, break it down further by paragraphs
      const subParagraphs = section.content.split(/\n\n+/);
      currentBuffer = previousOverlap ? previousOverlap + '\n\n' : '';

      for (const p of subParagraphs) {
        if ((currentBuffer + p).length > targetChars && currentBuffer.length >= minChars) {
          chunks.push(
            createChunk({
              id: `chk_${docOptions.documentId.slice(-6)}_${String(chunkCounter++).padStart(4, '0')}`,
              text: currentBuffer.trim(),
              section: currentSection,
              fileName,
              now,
              docOptions,
            })
          );
          previousOverlap = currentBuffer.slice(-overlapChars);
          currentBuffer = previousOverlap ? previousOverlap + '\n\n' + p : p;
        } else {
          currentBuffer = (currentBuffer ? currentBuffer + '\n\n' : '') + p;
        }
      }
    } else if (candidateText.length >= targetChars) {
      chunks.push(
        createChunk({
          id: `chk_${docOptions.documentId.slice(-6)}_${String(chunkCounter++).padStart(4, '0')}`,
          text: candidateText.trim(),
          section: currentSection,
          fileName,
          now,
          docOptions,
        })
      );
      previousOverlap = candidateText.slice(-overlapChars);
      currentBuffer = previousOverlap;
    } else {
      currentBuffer = candidateText;
    }
  }

  // Flush remaining buffer if it has content
  if (currentBuffer.trim().length > 0) {
    // If very small and we already have chunks, append to last chunk if not exceeding max
    if (chunks.length > 0 && currentBuffer.length < minChars) {
      const lastChunk = chunks[chunks.length - 1];
      if ((lastChunk.text + '\n\n' + currentBuffer).length <= maxChars) {
        lastChunk.text = (lastChunk.text + '\n\n' + currentBuffer).trim();
        lastChunk.metadata.token_count = estimateTokens(lastChunk.text);
        lastChunk.metadata.content_hash = computeContentHash(lastChunk.text);
      } else {
        chunks.push(
          createChunk({
            id: `chk_${docOptions.documentId.slice(-6)}_${String(chunkCounter++).padStart(4, '0')}`,
            text: currentBuffer.trim(),
            section: currentSection,
            fileName,
            now,
            docOptions,
          })
        );
      }
    } else {
      chunks.push(
        createChunk({
          id: `chk_${docOptions.documentId.slice(-6)}_${String(chunkCounter++).padStart(4, '0')}`,
          text: currentBuffer.trim(),
          section: currentSection,
          fileName,
          now,
          docOptions,
        })
      );
    }
  }

  return chunks;
}

function createChunk(params: {
  id: string;
  text: string;
  section: string;
  fileName: string;
  now: string;
  docOptions: {
    documentId: string;
    workspaceId: string;
    projectId: string;
    sourceType: RAGChunkMetadata['source_type'];
    accessLevel: AccessLevel;
  };
}): RAGChunk {
  const tokenCount = estimateTokens(params.text);
  const contentHash = computeContentHash(params.text);

  const metadata: RAGChunkMetadata = {
    document_id: params.docOptions.documentId,
    chunk_id: params.id,
    workspace_id: params.docOptions.workspaceId,
    project_id: params.docOptions.projectId,
    source_type: params.docOptions.sourceType,
    file_name: params.fileName,
    section: params.section,
    created_at: params.now,
    updated_at: params.now,
    access_level: params.docOptions.accessLevel,
    content_hash: contentHash,
    token_count: tokenCount,
  };

  return {
    id: params.id,
    text: params.text,
    metadata,
  };
}

/**
 * Splits document respecting Markdown headings (#, ##, ###) while preserving code blocks
 */
function splitByHeadingsAndParagraphs(text: string): Array<{ heading?: string; content: string }> {
  const lines = text.split('\n');
  const sections: Array<{ heading?: string; content: string }> = [];

  let currentHeading = 'Document Root';
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentLines.push(line);
      continue;
    }

    if (!inCodeBlock && /^#{1,4}\s+(.+)$/.test(line)) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
        });
        currentLines = [];
      }
      currentHeading = line.replace(/^#{1,4}\s+/, '').trim();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n').trim(),
    });
  }

  return sections.filter((s) => s.content.length > 0);
}
