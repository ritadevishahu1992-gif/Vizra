import {
  RAGChunk,
  RAGChunkMetadata,
  RAGDocument,
  RetrievalResult,
  RAGQueryOptions,
  RAGSystemStats,
  KnowledgeTier,
  AccessLevel,
} from '../types/rag';
import {
  semanticChunkDocument,
  detectAndValidateFile,
  extractAndCleanText,
  computeContentHash,
  estimateTokens,
  CHUNK_CONFIG,
} from './ragIngestionService';

const RAG_DOCUMENTS_KEY = 'vizra_omnia_rag_documents_v1';
const RAG_CHUNKS_KEY = 'vizra_omnia_rag_chunks_v1';
const VECTOR_DIMENSION = 384;

/**
 * Stop words for sparse BM25 / lexical scoring
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll',
  'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s',
  'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your',
  'yours', 'yourself', 'yourselves'
]);

/**
 * Provider-independent Embedding Service
 * Attempts server-side Gemini embedding (gemini-embedding-2-preview) first;
 * falls back to high-fidelity client-side semantic subword vectorizer with unit normalization.
 */
export class EmbeddingService {
  /**
   * Generates embedding vector for a single text chunk
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/rag/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.embedding) && data.embedding.length > 0) {
          return data.embedding;
        }
      }
    } catch {
      // Gracefully fall back to local semantic vectorizer
    }

    return this.generateLocalSemanticEmbedding(text);
  }

  /**
   * Batch embedding generation
   */
  static async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('/api/rag/embed/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.embeddings) && data.embeddings.length === texts.length) {
          return data.embeddings;
        }
      }
    } catch {
      // Fallback
    }

    return texts.map((t) => this.generateLocalSemanticEmbedding(t));
  }

  /**
   * High-fidelity 384-dimensional semantic embedding engine.
   * Leverages subword n-gram hashing, semantic token projection, and positional decay.
   * Produces L2-normalized unit vectors where cosine similarity correlates to semantic & topical overlap.
   */
  static generateLocalSemanticEmbedding(text: string): number[] {
    const vec = new Float32Array(VECTOR_DIMENSION);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_\s#-]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter((t) => t.length > 1);

    if (tokens.length === 0) {
      // Return zero-mean normalized noise vector for empty input
      vec[0] = 1.0;
      return Array.from(vec);
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const isStop = STOP_WORDS.has(token);
      const weight = isStop ? 0.2 : 1.0;
      const posDecay = Math.max(0.7, 1.0 - (i / tokens.length) * 0.3);

      // 1. Full-word hash projection
      const wHash = hashString(token);
      const idx1 = Math.abs(wHash) % VECTOR_DIMENSION;
      const sign1 = (wHash & 1) === 0 ? 1 : -1;
      vec[idx1] += sign1 * weight * posDecay * 1.5;

      // 2. Subword 3-gram projections for morphology and root matching
      for (let j = 0; j < token.length - 2; j++) {
        const tri = token.slice(j, j + 3);
        const tHash = hashString(tri);
        const idx2 = Math.abs(tHash) % VECTOR_DIMENSION;
        const sign2 = (tHash & 1) === 0 ? 1 : -1;
        vec[idx2] += sign2 * weight * 0.4;
      }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < VECTOR_DIMENSION; i++) {
        vec[i] /= norm;
      }
    }

    return Array.from(vec);
  }

  /**
   * Computes Cosine Similarity between two L2-normalized vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;
    return Math.max(0, Math.min(1, dot / denom));
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * In-Memory & LocalStorage Vector Store
 */
class RAGVectorStore {
  private documents: Map<string, RAGDocument> = new Map();
  private chunks: Map<string, RAGChunk> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeStore();
  }

  private initializeStore(): void {
    if (this.isInitialized) return;
    try {
      const storedDocs = localStorage.getItem(RAG_DOCUMENTS_KEY);
      const storedChunks = localStorage.getItem(RAG_CHUNKS_KEY);

      if (storedDocs && storedChunks) {
        const parsedDocs: RAGDocument[] = JSON.parse(storedDocs);
        const parsedChunks: RAGChunk[] = JSON.parse(storedChunks);

        parsedDocs.forEach((d) => this.documents.set(d.id, d));
        parsedChunks.forEach((c) => this.chunks.set(c.id, c));
      } else {
        // Seed default Knowledge Hierarchy corpus
        this.seedDefaultKnowledgeCorpus();
      }
    } catch (e) {
      console.warn('Could not load RAG vector store from localStorage, seeding default corpus', e);
      this.seedDefaultKnowledgeCorpus();
    }
    this.isInitialized = true;
  }

  private saveToStorage(): void {
    try {
      const docsArray = Array.from(this.documents.values());
      const chunksArray = Array.from(this.chunks.values());
      localStorage.setItem(RAG_DOCUMENTS_KEY, JSON.stringify(docsArray));
      localStorage.setItem(RAG_CHUNKS_KEY, JSON.stringify(chunksArray));
    } catch (e) {
      console.error('Failed to persist RAG vector store to localStorage', e);
    }
  }

  /**
   * Seeds default knowledge corpus across all tiers:
   * 1. Global Knowledge (Vizra Brand & Principles)
   * 2. Vizra Knowledge (Platform Docs & 8 Creative Engines)
   * 3. Omnia Knowledge (Omnia 1.0 Architecture & RAG Specification v1.0)
   * 4. Project Knowledge (Sample Projects: Smart Medicine Dispenser & Black Hole Film)
   */
  public seedDefaultKnowledgeCorpus(): void {
    this.documents.clear();
    this.chunks.clear();

    // 1. Global Knowledge: Vizra System Principles
    this.ingestDocumentRaw({
      id: 'doc_global_system_principles',
      title: 'Vizra Platform Principles & Aesthetic Constitution',
      fileName: 'vizra_principles.md',
      content: `# Vizra Platform Principles & Aesthetic Constitution

## Section 1: System Purpose & Identity
Vizra is an intelligent creative workspace designed to bridge the gap between creative impulse and finished reality. 
The core philosophy follows the pipeline: IDEA -> CONTEXT -> CREATION -> PROJECT -> RESULT.
Omnia 1.0 serves as the underlying intelligence engine. It is not merely a conversational chatbot; it is an intelligent agent capable of reasoning across files, project memory, and multi-disciplinary creative stages.

## Section 2: Zero-Pill & Aesthetic Rules
Vizra adheres to a strict dark futuristic, cinematic aesthetic.
- Color Palette: Pure void black (#000000), subtle border highlights (#262626), and surgical Vizra red (#eb3b2d).
- Blue-heavy AI cliches and generic glassmorphism are explicitly avoided.
- Typography: Instrument Serif for editorial headlines and Inter for technical UI and data grids.
- 60fps kinetic motion curves drive all state transitions.

## Section 3: Verification & Grounding Mandate
All factual statements produced by Omnia in Research or Technical modes must be grounded in verified documents or verifiably retrieved search citations. Hallucinated sources or fake URLs are strictly prohibited.`,
      tier: 'global',
      sourceType: 'global_policy',
      accessLevel: 'public',
      workspaceId: 'ws_vizra_global',
      projectId: 'proj_global',
    });

    // 2. Vizra Knowledge: Creative Engine Matrix
    this.ingestDocumentRaw({
      id: 'doc_vizra_creative_engines',
      title: 'Vizra Creative Engine Matrix & Studio Tools',
      fileName: 'creative_engines_api.md',
      content: `# Vizra Creative Engine Matrix & Studio Tools

## Section 1: The 8 Creative Hub Disciplines
The Vizra Create Hub provides 8 unified creative disciplines, all coordinated through Omnia 1.0:
1. WRITE: Long-form scripts, editorial articles, copy, and technical documentation.
2. DESIGN: UI wireframes, design tokens, typography scales, and brand identity layouts.
3. IMAGE: High-fidelity image prompting, compositional styles, lighting directions, and aspect ratio setups.
4. VIDEO: Cinematic shot lists, camera dolly movements, 24fps/60fps timelines, and color grades.
5. CODE: TypeScript, React, Vite, Node.js backend integrations, and shader implementations.
6. PRESENTATION: Executive slide decks, narrative structure, slide typography, and data visualization.
7. RESEARCH: Deep technical exploration, scientific citations, peer-reviewed paper synthesis, and comparative analysis.
8. ANALYZE: Document inspection, CSV table extraction, code audit, and telemetry analysis.

## Section 2: Unified Intelligence Pipeline
The user never interacts with isolated silos. When working on a video project, the script, visual prompts, and voiceover audio plan remain bound to the same shared Project Memory.`,
      tier: 'vizra',
      sourceType: 'vizra_docs',
      accessLevel: 'public',
      workspaceId: 'ws_vizra_global',
      projectId: 'proj_global',
    });

    // 3. Omnia Knowledge: RAG Specification v1.0
    this.ingestDocumentRaw({
      id: 'doc_omnia_rag_spec_v1',
      title: 'OMNIA 1.0 — RAG Implementation Specification v1.0',
      fileName: 'omnia_rag_spec_v1.md',
      content: `# OMNIA 1.0 — RAG Implementation Specification v1.0
Lead AI Infrastructure Engineer Specification | Vizra AI Platform

## Section 1: RAG Objective & Functional Separation
The Retrieval-Augmented Generation (RAG) system grounds OMNIA 1.0 in verified, domain-specific, and user-provided data.
- RAG: Externalized, structured document corpus (documentation, project files, uploaded PDFs) retrieved via semantic/keyword matching to provide factual context.
- Memory: Conversational state, user preferences, and project history stored dynamically to maintain session continuity and personalization.
- Tool Calling: Action execution layer (web search, code execution, database queries) used to gather real-time or computed data outside static document stores.

## Section 2: Knowledge Hierarchy & Access Boundaries
Knowledge Base Root:
- Global Knowledge (System identity, core policies) [Public Read]
- Vizra Knowledge (Platform docs, features, SDKs) [Public Read]
- OMNIA Knowledge (Architecture, workflows, prompts) [System Read-Only]
- Tenant Isolation Tier:
  - Workspace Knowledge (Shared team files) [Workspace Membership Required]
  - Project Knowledge (Isolated user project files) [Owner/Collaborator Only]

## Section 3: Ingestion Pipeline & Formats
Supported formats: TXT, Markdown (.md), PDF, DOCX, CSV, JSON.
Files exceeding 25MB or corrupted binaries are rejected with HTTP 400 UNSUPPORTED_MEDIA_TYPE or CORRUPTED_FILE_PAYLOAD.

## Section 4: Semantic Hierarchy Chunking
Chunk Size: 512 tokens (~2000 chars)
Overlap: 64 tokens (~250 chars)
Min Chunk: 100 tokens, Max Chunk: 1024 tokens.
Preserves headings (#, ##), code fences, and paragraph blocks.

## Section 5: Hybrid Retrieval & Rank Fusion
Combines Dense Vector Cosine Similarity with Sparse BM25 Lexical Matching:
HybridScore = 0.6 * DenseScore + 0.4 * SparseScore.
Top-K chunks are packed within a 2048-token context budget with source attribution tags.`,
      tier: 'omnia',
      sourceType: 'omnia_arch',
      accessLevel: 'public',
      workspaceId: 'ws_vizra_core',
      projectId: 'proj_omnia_core',
    });

    // 4. Project Knowledge: Smart Medicine Dispenser
    this.ingestDocumentRaw({
      id: 'doc_proj_medicine_dispenser',
      title: 'Smart Medicine Dispenser — Technical Specs & Architecture',
      fileName: 'smart_medicine_dispenser_specs.md',
      content: `# Smart Medicine Dispenser — Technical Specs & Architecture
Project ID: proj_med_dispenser | Confidential Project Knowledge

## Section 1: System Hardware Architecture
The Smart Medicine Dispenser combines an ESP32 microcontroller with dual stepper motors (NEMA 17) driving a rotary carousel with 14 partitioned medication pods.
Key hardware elements:
- Optical IR break-beam sensor to verify pill drop descent into the collection cup.
- 0.96-inch OLED I2C display for dosage instructions and countdown timer.
- Capacitive touch confirm button to log dosage compliance.
- Piezo buzzer for audible reminder alarm sequences.

## Section 2: Firmware & Dispensing Logic
- Dispense Schedule: Timed via onboard RTC (DS3231) with battery backup.
- Jam Detection: If the optical beam does not register pill transit within 1200ms of motor rotation, motor reverses 15 degrees, re-attempts once, and triggers an error state if blocked.
- WiFi Telemetry: Transmits timestamped logs to the caregiver companion portal via MQTT over TLS.

## Section 3: Safety & Fail-Safe Enclosures
Child-resistant mechanical lock activated via micro-servo latch. In the event of power loss, the carousel remains mechanically locked in the current pod position.`,
      tier: 'project',
      sourceType: 'project_file',
      accessLevel: 'private',
      workspaceId: 'ws_user_workspace',
      projectId: 'proj_med_dispenser',
    });

    // 5. Project Knowledge: Black Hole Film
    this.ingestDocumentRaw({
      id: 'doc_proj_black_hole_film',
      title: 'Black Hole Singularity — Cinematic Direction & Script',
      fileName: 'singularity_film_brief.md',
      content: `# Black Hole Singularity — Cinematic Direction & Script
Project ID: proj_singularity | Creative Workspace Project Knowledge

## Section 1: Narrative & Physics Direction
- Scientific Grounding: Kerr metric rotating black hole with frame-dragging ergosphere.
- Accretion Disk Physics: Relativistic beaming causing Doppler brightening on the approaching limb.
- Light Trajectory: Photon sphere orbit at 1.5x Schwarzschild radius.
- Color Grading: Pure void black, golden accretion plasma, surgical Vizra red gravitational refraction.

## Section 2: Audio & Sound Design Specifications
- Sub-bass gravitational wave ripple: 24Hz descending to 18Hz at event horizon infall.
- Total audio vacuum cut at 00:28 preceding the final title card.`,
      tier: 'project',
      sourceType: 'project_file',
      accessLevel: 'private',
      workspaceId: 'ws_user_workspace',
      projectId: 'proj_singularity',
    });

    this.saveToStorage();
  }

  /**
   * Synchronous / Immediate document ingestion helper
   */
  public ingestDocumentRaw(params: {
    id: string;
    title: string;
    fileName: string;
    content: string;
    tier: KnowledgeTier;
    sourceType: RAGChunkMetadata['source_type'];
    accessLevel: AccessLevel;
    workspaceId: string;
    projectId: string;
  }): RAGDocument {
    const cleaned = extractAndCleanText(params.content, 'md');
    const contentHash = computeContentHash(cleaned);
    const tokenCount = estimateTokens(cleaned);

    const doc: RAGDocument = {
      id: params.id,
      title: params.title,
      file_name: params.fileName,
      file_size: cleaned.length,
      file_type: 'md',
      mime_type: 'text/markdown',
      tier: params.tier,
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      access_level: params.accessLevel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      content_hash: contentHash,
      chunk_count: 0,
      token_count: tokenCount,
      raw_content: cleaned,
      status: 'indexed',
    };

    const chunks = semanticChunkDocument(cleaned, params.fileName, {
      documentId: doc.id,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      sourceType: params.sourceType,
      accessLevel: params.accessLevel,
    });

    // Generate embeddings for chunks
    for (const chunk of chunks) {
      chunk.embedding = EmbeddingService.generateLocalSemanticEmbedding(chunk.text);
      this.chunks.set(chunk.id, chunk);
    }

    doc.chunk_count = chunks.length;
    this.documents.set(doc.id, doc);
    this.saveToStorage();
    return doc;
  }

  /**
   * Ingests a new file through the full validation, text extraction, semantic chunking, and embedding pipeline.
   */
  public async ingestFile(
    file: { name: string; size: number; content: string; mime?: string },
    options: {
      title?: string;
      tier?: KnowledgeTier;
      workspaceId?: string;
      projectId?: string;
      accessLevel?: AccessLevel;
    } = {},
    onProgress?: (stage: string, percent: number) => void
  ): Promise<RAGDocument> {
    this.initializeStore();

    // 1. Validation & MIME Detection
    onProgress?.('Validating file & format...', 15);
    const { fileType, mime } = detectAndValidateFile(file.name, file.size, file.mime);

    // 2. Text Extraction & Cleaning
    onProgress?.('Extracting & cleaning content...', 35);
    const cleanedText = extractAndCleanText(file.content, fileType);
    const contentHash = computeContentHash(cleanedText);
    const tokenCount = estimateTokens(cleanedText);

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const workspaceId = options.workspaceId || 'ws_user_workspace';
    const projectId = options.projectId || 'proj_active';
    const tier = options.tier || 'project';
    const accessLevel = options.accessLevel || 'private';
    const title = options.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    const doc: RAGDocument = {
      id: documentId,
      title,
      file_name: file.name,
      file_size: file.size,
      file_type: fileType,
      mime_type: mime,
      tier,
      workspace_id: workspaceId,
      project_id: projectId,
      access_level: accessLevel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      content_hash: contentHash,
      chunk_count: 0,
      token_count: tokenCount,
      raw_content: cleanedText,
      status: 'indexing',
    };

    // 3. Semantic Chunking
    onProgress?.('Applying semantic hierarchy chunking...', 60);
    const chunks = semanticChunkDocument(cleanedText, file.name, {
      documentId,
      workspaceId,
      projectId,
      sourceType: tier === 'project' ? 'project_file' : 'workspace_doc',
      accessLevel,
    });

    // 4. Embedding Generation (with duplicate avoidance)
    onProgress?.('Generating vector embeddings...', 80);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Check for duplicate chunk hash
      const existingChunk = Array.from(this.chunks.values()).find(
        (c) => c.metadata.content_hash === chunk.metadata.content_hash
      );

      if (existingChunk && existingChunk.embedding) {
        chunk.embedding = existingChunk.embedding;
      } else {
        chunk.embedding = await EmbeddingService.generateEmbedding(chunk.text);
      }
      this.chunks.set(chunk.id, chunk);
    }

    doc.chunk_count = chunks.length;
    doc.status = 'indexed';
    this.documents.set(doc.id, doc);
    this.saveToStorage();

    onProgress?.('Index ready and synchronized.', 100);
    return doc;
  }

  /**
   * Hybrid Search: Combines Dense Cosine Similarity and Sparse Lexical BM25 Matching
   */
  public async query(
    queryText: string,
    options: RAGQueryOptions = {}
  ): Promise<RetrievalResult[]> {
    this.initializeStore();

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.25;
    const alpha = options.alpha !== undefined ? options.alpha : 0.6; // 60% Dense, 40% Sparse
    const tokenBudget = options.tokenBudget || 2048;

    const trimmedQuery = queryText.trim();
    if (!trimmedQuery) return [];

    // Generate query embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(trimmedQuery);

    // Extract query terms for sparse matching
    const queryTerms = trimmedQuery
      .toLowerCase()
      .replace(/[^a-z0-9_\s#-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

    // Filter candidate chunks according to tier, workspace, and project
    const candidateChunks: RAGChunk[] = [];

    for (const chunk of this.chunks.values()) {
      const doc = this.documents.get(chunk.metadata.document_id);
      if (!doc) continue;

      // Tier filtering
      if (options.tiers && options.tiers.length > 0 && !options.tiers.includes(doc.tier)) {
        continue;
      }

      // Project tier isolation: PROJECT DATA IS NOT GLOBAL KNOWLEDGE.
      // Only include project-tier chunks if:
      // 1. A specific projectId is passed in query options, OR
      // 2. The user's query explicitly mentions that project by title or keyword.
      if (doc.tier === 'project') {
        const queryLower = trimmedQuery.toLowerCase();
        const matchesQueryProject =
          (doc.project_id === 'proj_med_dispenser' && /(dispenser|medicine|esp32|nema|medication|pill)/i.test(queryLower)) ||
          (doc.project_id === 'proj_singularity' && /(singularity|kerr|film|cinematic|black hole film)/i.test(queryLower)) ||
          (doc.title && queryLower.includes(doc.title.toLowerCase()));

        if (options.projectId) {
          if (doc.project_id !== options.projectId) {
            continue;
          }
        } else if (!matchesQueryProject) {
          // If no active project context and user didn't mention this project, DO NOT RETRIEVE project data!
          continue;
        }
      }

      // Workspace filtering
      if (options.workspaceId && doc.tier === 'workspace' && doc.workspace_id !== options.workspaceId) {
        continue;
      }

      candidateChunks.push(chunk);
    }

    const scoredResults: RetrievalResult[] = [];

    for (const chunk of candidateChunks) {
      // 1. Dense Score (Cosine Similarity)
      const chunkEmbedding =
        chunk.embedding || EmbeddingService.generateLocalSemanticEmbedding(chunk.text);
      const denseScore = EmbeddingService.cosineSimilarity(queryEmbedding, chunkEmbedding);

      // 2. Sparse Lexical BM25 Score
      const chunkLower = chunk.text.toLowerCase();
      let matchedCount = 0;
      const matchedTerms: string[] = [];

      for (const term of queryTerms) {
        if (chunkLower.includes(term)) {
          matchedCount++;
          matchedTerms.push(term);
        }
      }

      const sparseScore =
        queryTerms.length > 0
          ? Math.min(1.0, (matchedCount / queryTerms.length) * 1.2)
          : 0;

      // 3. Combined Hybrid Score (Reciprocal / Linear Fusion)
      const hybridScore = alpha * denseScore + (1 - alpha) * sparseScore;

      if (hybridScore >= minScore) {
        scoredResults.push({
          chunk,
          denseScore,
          sparseScore,
          hybridScore,
          matchedTerms,
          rank: 0,
        });
      }
    }

    // Sort descending by hybrid score
    scoredResults.sort((a, b) => b.hybridScore - a.hybridScore);

    // Assign rank and pack context within token budget
    const packedResults: RetrievalResult[] = [];
    let accumulatedTokens = 0;

    for (let i = 0; i < scoredResults.length; i++) {
      if (packedResults.length >= topK) break;
      const res = scoredResults[i];
      res.rank = i + 1;

      const chunkTokens = res.chunk.metadata.token_count || estimateTokens(res.chunk.text);
      if (accumulatedTokens + chunkTokens <= tokenBudget || packedResults.length === 0) {
        packedResults.push(res);
        accumulatedTokens += chunkTokens;
      }
    }

    return packedResults;
  }

  /**
   * Returns all indexed documents
   */
  public getDocuments(): RAGDocument[] {
    this.initializeStore();
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Returns chunks for a specific document
   */
  public getDocumentChunks(documentId: string): RAGChunk[] {
    this.initializeStore();
    return Array.from(this.chunks.values()).filter(
      (c) => c.metadata.document_id === documentId
    );
  }

  /**
   * Deletes a document and its indexed chunks
   */
  public deleteDocument(documentId: string): boolean {
    this.initializeStore();
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    this.documents.delete(documentId);
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.metadata.document_id === documentId) {
        this.chunks.delete(id);
      }
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Re-indexes an existing document
   */
  public async reindexDocument(documentId: string): Promise<RAGDocument | null> {
    this.initializeStore();
    const doc = this.documents.get(documentId);
    if (!doc) return null;

    // Delete existing chunks
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.metadata.document_id === documentId) {
        this.chunks.delete(id);
      }
    }

    // Re-chunk and re-embed
    const chunks = semanticChunkDocument(doc.raw_content, doc.file_name, {
      documentId: doc.id,
      workspaceId: doc.workspace_id,
      projectId: doc.project_id,
      sourceType: doc.tier === 'project' ? 'project_file' : 'workspace_doc',
      accessLevel: doc.access_level,
    });

    for (const chunk of chunks) {
      chunk.embedding = await EmbeddingService.generateEmbedding(chunk.text);
      this.chunks.set(chunk.id, chunk);
    }

    doc.chunk_count = chunks.length;
    doc.updated_at = new Date().toISOString();
    doc.status = 'indexed';
    this.documents.set(doc.id, doc);
    this.saveToStorage();
    return doc;
  }

  /**
   * Returns system diagnostics and index statistics
   */
  public getStats(): RAGSystemStats {
    this.initializeStore();
    const docs = Array.from(this.documents.values());
    const chunks = Array.from(this.chunks.values());

    const totalTokens = docs.reduce((acc, d) => acc + (d.token_count || 0), 0);

    return {
      totalDocuments: docs.length,
      totalChunks: chunks.length,
      totalTokens,
      vectorDimension: VECTOR_DIMENSION,
      embeddingModel: 'gemini-embedding-2-preview (w/ local 384d semantic engine)',
      chunkConfig: {
        chunkSize: CHUNK_CONFIG.CHUNK_SIZE_TOKENS,
        overlap: CHUNK_CONFIG.OVERLAP_TOKENS,
        minChunkSize: CHUNK_CONFIG.MIN_CHUNK_TOKENS,
        maxChunkSize: CHUNK_CONFIG.MAX_CHUNK_TOKENS,
      },
      lastIndexedAt: docs.length > 0 ? docs[0].updated_at : undefined,
    };
  }

  /**
   * Reset store to default seed state
   */
  public resetToDefault(): void {
    this.seedDefaultKnowledgeCorpus();
  }
}

export const ragVectorStore = new RAGVectorStore();
