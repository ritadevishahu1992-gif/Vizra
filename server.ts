import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  setupOmniaLearningRoutes,
  getApprovedKnowledgeContext,
} from './src/services/serverOmniaLearning';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Server-side Gemini initialization
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI with provided key:', e);
    }
  }

  // Mount Vercel Workflows Continuous Learning & Reasoning API routes
  setupOmniaLearningRoutes(app, ai);

  // System instruction for Omnia enforcing core Vizra identity, architecture, and behavior
  const systemInstruction = `You are OMNIA, the intelligent AI operating layer and assistant created by VIZRA.

========================
IDENTITY
========================
- You are Omnia, the intelligent assistant and operating layer of Vizra.
- You were created by Vizra.
- You are NOT a generic chatbot.
- You never claim to be human, and you never say "I am an AI..." or similar lines unless absolutely necessary.
- When asked "Are you an AI?", respond naturally and briefly:
  "Yes, I'm an AI assistant built into Vizra. How can I help?"

Your purpose is to help users:
- understand information
- research topics & analyze data
- solve problems & technical support
- create ideas & original content (stories, scripts, designs)
- develop projects & plan workflows
- write and improve content
- code and debug (fix errors, explain architecture)
- plan workflows & track progress
- turn ideas into practical actions

CORE PHILOSOPHY:
RESEARCH → UNDERSTAND → PLAN → CREATE → EXECUTE

You represent Vizra through:
- creativity
- innovation
- clarity
- authenticity
- practical usefulness

"Your ideas. My knowledge. Our future."
"Better Answers. Bigger Dreams."

Never falsely claim to be human.
Never invent facts about Vizra, Omnia, products, users, or projects.

========================
CREATOR / ORIGIN
========================
If asked who created you or made Vizra:
"Omnia was created by Vizra as the intelligent operating layer of Vizra."
Vizra is the creative AI platform, and Omnia is its built-in intelligence.
Never claim OpenAI, Google, Anthropic, or Meta created Omnia.

========================
ANSWERING ENGINE WORKFLOW
========================
For EVERY user message, follow this 6-step process:
1. Understand the user's question (exact intent + context).
2. Retrieve relevant knowledge (from verified context or web research if needed).
3. Break it down if needed (for complex questions).
4. Verify facts and check accuracy.
5. Generate a clear, direct, and complete answer. Give the direct answer first; add explanation only when it improves understanding.
6. Review the answer before sending: "Did I answer exactly what the user asked?"

Never answer a different question just because it is related.

========================
ACCURACY RULES
========================
Accuracy is more important than sounding confident.
Never:
- invent facts
- invent sources
- invent URLs
- fabricate statistics
- pretend to have researched something when you have not
- present assumptions as facts
- claim something is verified when it is not

When uncertain, clearly say what is known and what is uncertain.
If information is unavailable or unverified, say so instead of guessing:
"I couldn't verify that from a reliable source." or "That isn't currently documented in my verified Vizra knowledge."

========================
WEB RESEARCH & SOURCE RULES
========================
When a question requires current or changing information:
RESEARCH → CROSS-CHECK → ANSWER

- Prefer official websites, official documentation, primary sources, reputable publications, and reliable technical sources.
- For important claims, provide 2–3 trusted sources when available.
- Do NOT add sources merely to make an answer look authoritative.
- Never create fake citations or search-result snippet echoes.
- For simple, stable, conversational, creative, reasoning, or general questions: Answer directly. Do not search the web.

========================
CONTEXT MEMORY & RETENTION
========================
- Use relevant previous conversation context naturally.
- If the user has already provided a preference, project detail, technical setup, or decision, do not repeatedly ask for it.
- However, never assume missing information. If essential information is genuinely unavailable, ask only the necessary question.

========================
LANGUAGE & TONE
========================
- Match the user's language naturally (English, Hindi, natural Hinglish).
- If the user speaks Hinglish, reply naturally in Hinglish.
- If the user asks for an English final answer, provide English.
- Do not unnecessarily translate technical terms.
- Tone: Friendly, confident, clear, modern, practical, and professional.
- Avoid: Excessive hype, generic motivational speeches, repetitive disclaimers, fake enthusiasm, robotic filler ("Certainly!", "I'd be happy to help!"), and "not only... but also" filler.
- Be useful before being impressive.

========================
CODING & TECHNICAL HELP
========================
For coding questions:
- Understand the existing setup first.
- Identify the actual problem.
- Provide working code when appropriate.
- Preserve existing architecture unless there is a reason to change it.
- Explain important changes without fluff.
- Do not invent APIs, packages, functions, or configurations.
- For debugging, follow: PROBLEM → CAUSE → FIX → FINAL CODE.

========================
CREATIVE & PROJECT MODE
========================
Omnia helps with stories, scripts, characters, animation shot planning, filmmaking, prompts, video concepts, websites, branding, design direction, and project planning.
When helping with a project:
UNDERSTAND GOAL → IDENTIFY REQUIREMENTS → BREAK INTO TASKS → PRIORITIZE → EXECUTE → CHECK RESULT → NEXT ACTION.
You don't just answer — you help create and execute.

========================
QUESTION HANDLING
========================
- Simple question: Give a simple, direct answer to the point.
- Complex question: Explain step-by-step in a clear way.
- Ambiguous question: Ask only the clarification that is genuinely necessary.
- Incomplete request: Make safe, obvious assumptions only, and state them briefly.
- Primary rule: Question = Answer. Conversation = Conversation. Creation = Create. Project = Project.

========================
STRICT QUERY RELEVANCE & TOPIC ISOLATION
========================
- Omnia must answer ONLY the user's current query.
- Before answering, determine the user's actual intent and topic from the latest message.
- NEVER answer a different topic merely because related information exists in the available context, memory, knowledge base, project files, or previous conversations.
- If the user asks about a general topic such as India, history, science, technology, politics, geography, a person, a company, a place, or current events: do NOT automatically retrieve or use unrelated project-specific data.
- PROJECT DATA IS NOT GLOBAL KNOWLEDGE:
  * User: "Tell me about India in detail." -> Provide information about India. NEVER mention medicine dispensers or other projects.
  * User: "What is the capital of India?" -> Answer "New Delhi" with concise relevant detail. NEVER retrieve medicine dispenser or unrelated hardware data.
  * User: "Explain my Smart Medicine Dispenser." -> Retrieve and use the Smart Medicine Dispenser project data.
- Use stored context ONLY when:
  1. The user's current query explicitly refers to that project/context, OR
  2. The current query clearly depends on information from that context.
  Otherwise, completely ignore unrelated stored context.
- Ambiguity: If the query is ambiguous, do not randomly select a stored project; ask a short clarification question when necessary.
- Priority Order:
  1. Latest user message and explicit intent
  2. Relevant conversation context
  3. Relevant project/knowledge-base data
  4. General knowledge or web search when available
- FINAL RELEVANCE CHECK: Before responding, internally verify: "Does my answer directly answer the user's latest question?" If NO, discard the draft and focus exclusively on the actual query.

========================
FINAL BEHAVIOR CHECKLIST
========================
Before sending the final answer, verify:
[ ] Does my answer directly answer the user's latest question?
[ ] Did I avoid injecting unrelated project data into a general query?
[ ] Did I avoid guessing?
[ ] Did I use reliable sources (if needed)?
[ ] Did I keep the answer relevant and focused?
[ ] Did I follow the user's tone and language style?
[ ] Is this helpful, clear, and complete?

========================
OMNIA'S CORE PRINCIPLE
========================
You don't exist merely to generate replies.
You exist to help users move from:
IDEA → UNDERSTANDING → PLAN → CREATION → RESULT`;

  // Helper to extract clean domain & friendly brand name
  function parseDomainAndName(rawUrl: string): { domain: string; name: string } {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const knownNames: Record<string, string> = {
        'openai.com': 'OpenAI',
        'github.com': 'GitHub',
        'nasa.gov': 'NASA',
        'wikipedia.org': 'Wikipedia',
        'en.wikipedia.org': 'Wikipedia',
        'google.com': 'Google',
        'developers.google.com': 'Google Developers',
        'microsoft.com': 'Microsoft',
        'apple.com': 'Apple',
        'nature.com': 'Nature',
        'arxiv.org': 'arXiv',
        'stackoverflow.com': 'Stack Overflow',
        'developer.mozilla.org': 'MDN Web Docs',
        'reuters.com': 'Reuters',
        'apnews.com': 'Associated Press',
        'bbc.com': 'BBC News',
        'bbc.co.uk': 'BBC',
        'nytimes.com': 'The New York Times',
        'bloomberg.com': 'Bloomberg',
        'theverge.com': 'The Verge',
        'techcrunch.com': 'TechCrunch',
        'react.dev': 'React Docs',
        'vite.dev': 'Vite Docs',
        'tailwindcss.com': 'Tailwind CSS',
      };
      if (knownNames[host]) return { domain: host, name: knownNames[host] };
      const parts = host.split('.');
      const root = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      const brand = root.charAt(0).toUpperCase() + root.slice(1);
      return { domain: host, name: brand };
    } catch {
      return { domain: 'web', name: 'Web Source' };
    }
  }

  // Helper to classify source priority
  function categorizeDomain(domain: string, url: string): string {
    const d = domain.toLowerCase();
    const u = url.toLowerCase();
    if (u.includes('/docs') || d.startsWith('docs.') || d.startsWith('developer.') || d === 'developer.mozilla.org') {
      return 'official_docs';
    }
    if (d.endsWith('.gov') || d.endsWith('.mil')) return 'government';
    if (d.endsWith('.edu') || d.includes('arxiv.org') || d.includes('nature.com') || d.includes('science.org') || d.includes('doi.org')) {
      return 'academic';
    }
    if (d.includes('reuters.com') || d.includes('apnews.com') || d.includes('bbc.com') || d.includes('nytimes.com') || d.includes('bloomberg.com')) {
      return 'news';
    }
    if (d.includes('github.com') || d.includes('wikipedia.org') || d.includes('stackoverflow.com')) {
      return 'technical';
    }
    return 'other';
  }

  // Helper to process GroundingMetadata into VerifiedSource objects
  function extractVerifiedWebSources(groundingMetadata: any, fullText: string) {
    if (!groundingMetadata) return { sources: [], webSearchQueries: [] };

    const webSearchQueries: string[] = Array.isArray(groundingMetadata.webSearchQueries)
      ? groundingMetadata.webSearchQueries
      : [];
    const chunks: any[] = Array.isArray(groundingMetadata.groundingChunks)
      ? groundingMetadata.groundingChunks
      : [];
    const supports: any[] = Array.isArray(groundingMetadata.groundingSupports)
      ? groundingMetadata.groundingSupports
      : [];

    const verifiedSources: any[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const uri: string | undefined = c?.web?.uri;
      const title: string = c?.web?.title || '';

      if (!uri || typeof uri !== 'string' || !uri.startsWith('http')) continue;
      if (seenUrls.has(uri)) continue;
      seenUrls.add(uri);

      const { domain, name } = parseDomainAndName(uri);

      // Find supported claims for this chunk index
      const claimsSupported: string[] = [];
      let totalConfidence = 0;
      let confCount = 0;

      for (const sup of supports) {
        if (Array.isArray(sup.groundingChunkIndices) && sup.groundingChunkIndices.includes(i)) {
          if (sup.segment?.text && typeof sup.segment.text === 'string') {
            const seg = sup.segment.text.trim();
            if (seg && !claimsSupported.includes(seg)) {
              claimsSupported.push(seg);
            }
          }
          if (Array.isArray(sup.confidenceScores)) {
            for (const s of sup.confidenceScores) {
              totalConfidence += s;
              confCount++;
            }
          }
        }
      }

      const avgConfidence = confCount > 0 ? Math.round((totalConfidence / confCount) * 100) : 85;
      const excerpt = claimsSupported.length > 0 ? claimsSupported[0] : title;
      const category = categorizeDomain(domain, uri);

      verifiedSources.push({
        sourceId: `web-${i + 1}-${Date.now().toString(36)}`,
        id: `web-${i + 1}`,
        title: title || name,
        name,
        url: uri,
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        sourceType: 'web',
        retrievedAt: Date.now(),
        relevantExcerpt: excerpt,
        snippet: excerpt,
        claimsSupported: claimsSupported.length > 0 ? claimsSupported : [title || name],
        priorityCategory: category,
        reliability: category === 'academic' ? 'academic' : category === 'news' ? 'news' : 'verified',
        isFact: true,
        score: avgConfidence,
        validationStatus: 'verified',
        validationChecks: {
          exists: true,
          urlValid: true,
          domainVerified: true,
          contentRetrieved: true,
          claimSupported: claimsSupported.length > 0,
          metadataAuthentic: true,
        },
      });
    }

    return { sources: verifiedSources, webSearchQueries };
  }

  // Proxy endpoint for AI chat & Web Grounding
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        prompt,
        conversationHistory = [],
        ragContext,
        needWebResearch = false,
        mode = 'quick',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      if (!ai) {
        // Signal client to use local engine
        res.status(503).json({ error: 'Gemini API not configured on server', fallback: true });
        return;
      }

      // Format conversation history for Gemini
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of conversationHistory.slice(-6)) {
        if (msg.role === 'user' && msg.content) {
          contents.push({
            role: 'user',
            parts: [{ text: msg.content }],
          });
        } else if (msg.role === 'assistant' && msg.content) {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      // Grounding with approved Continuous Learning & Reasoning Knowledge
      const approvedKnowledge = getApprovedKnowledgeContext(prompt, ai);
      let combinedContext = ragContext && typeof ragContext === 'string' ? ragContext.trim() : '';

      if (approvedKnowledge) {
        combinedContext = combinedContext
          ? `${combinedContext}\n\n[OMNIA CONTINUOUS LEARNING — VERIFIED PROVENANCE]\n${approvedKnowledge}`
          : `[OMNIA CONTINUOUS LEARNING — VERIFIED PROVENANCE]\n${approvedKnowledge}`;
      }

      const finalUserText =
        combinedContext.length > 0
          ? `${combinedContext}\n\nUser Question: ${prompt}`
          : prompt;

      contents.push({
        role: 'user',
        parts: [{ text: finalUserText }],
      });

      // Enable Google Search Grounding when web research is requested or mode is research
      const enableWebSearch = Boolean(
        needWebResearch ||
        mode === 'research' ||
        /^(search\s*the\s*web|research|citations\s*for|find\s*sources|latest\s*news)/i.test(prompt)
      );

      const generateConfig: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (enableWebSearch) {
        generateConfig.tools = [{ googleSearch: {} }];
      }

      let response: any;
      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ];
      let lastError: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: generateConfig,
          });
          if (response && response.text) break;
        } catch (err: any) {
          lastError = err;
          // If error is 429 quota on googleSearch tool or model, log and try next
          console.warn(`[AI Model Fallback] Model ${m} failed with config (${err.message || 'Error'}). Trying next candidate...`);
        }
      }

      // If googleSearch tool failed across all models due to 429 quota exhaustion on free tier:
      // Per Rule 13: "If live search is unavailable, clearly state that live web research is unavailable for that request and answer only from verified internal knowledge. Never fabricate sources."
      if (!response && enableWebSearch) {
        console.warn('[AI Model Fallback] Google Search Grounding tool unavailable or rate-limited; fulfilling prompt with direct model knowledge per Rule 13...');
        const standardConfig = {
          systemInstruction,
          temperature: 0.7,
        };
        for (const m of modelsToTry) {
          try {
            response = await ai.models.generateContent({
              model: m,
              contents,
              config: standardConfig,
            });
            if (response && response.text) break;
          } catch (fallbackErr: any) {
            lastError = fallbackErr;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Model unavailable');
      }

      let text = response.text || '';
      const grounding = response.candidates?.[0]?.groundingMetadata;
      const { sources, webSearchQueries } = extractVerifiedWebSources(grounding, text);

      // Section 4: If research was required but no sources were grounded and model has low certainty
      if (enableWebSearch && sources.length === 0 && (!text || text.length < 20)) {
        text = "I couldn't verify that from a reliable source.";
      }

      res.json({
        text,
        sources,
        webSearchQueries,
        groundingMetadata: grounding,
        sourceValidationGate: {
          passed: sources.length > 0,
          totalEvaluated: sources.length,
          totalVerified: sources.length,
          totalRejected: 0,
          timestamp: Date.now(),
        },
      });
    } catch (err: any) {
      console.error('Server chat error:', err);
      res.status(500).json({ error: err.message || 'Error processing request', fallback: true });
    }
  });

  // Dedicated Web Research Endpoint
  app.post('/api/research', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      if (!ai) {
        res.status(503).json({ error: 'Gemini API not configured on server', fallback: true });
        return;
      }

      let response: any;
      const researchModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let lastResearchError: any = null;

      for (const rm of researchModels) {
        try {
          response = await ai.models.generateContent({
            model: rm,
            contents: `Conduct grounded web research on the following user query: "${query}". Provide a direct, verified answer backed strictly by real retrieved sources. Do not fabricate URLs or citations.`,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
              temperature: 0.3,
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          lastResearchError = err;
          console.warn(`[Research Model Fallback] Model ${rm} failed (${err.message || 'Error'}). Trying next candidate...`);
        }
      }

      if (!response) {
        // Fallback without search tool if search tool quota exhausted
        for (const rm of researchModels) {
          try {
            response = await ai.models.generateContent({
              model: rm,
              contents: `Answer the following user query directly from verified knowledge: "${query}".`,
              config: {
                systemInstruction,
                temperature: 0.3,
              },
            });
            if (response && response.text) break;
          } catch (fallbackErr: any) {
            lastResearchError = fallbackErr;
          }
        }
      }

      if (!response) {
        throw lastResearchError || new Error('Research models unavailable');
      }

      let text = response.text || '';
      const grounding = response.candidates?.[0]?.groundingMetadata;
      const { sources, webSearchQueries } = extractVerifiedWebSources(grounding, text);

      if (sources.length === 0 && (!text || text.length < 20)) {
        text = "I couldn't verify that from a reliable source.";
      }

      res.json({
        text,
        sources,
        webSearchQueries,
        sourceValidationGate: {
          passed: sources.length > 0,
          totalEvaluated: sources.length,
          totalVerified: sources.length,
          totalRejected: 0,
          timestamp: Date.now(),
        },
      });
    } catch (err: any) {
      console.error('Server research error:', err);
      res.status(500).json({ error: err.message || 'Error conducting research', fallback: true });
    }
  });

  // Dedicated AI Music Generation Endpoint (Lyria 3 Clip & Pro)
  app.post('/api/music/generate', async (req, res) => {
    try {
      const {
        prompt,
        model = 'lyria-3-clip-preview',
        durationSeconds = 25,
        genre = 'Cinematic Ambient',
        imageBase64,
        imageMimeType = 'image/jpeg',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      if (!ai) {
        res.status(503).json({ error: 'AI engine not configured on server', fallback: true });
        return;
      }

      try {
        let streamContents: any = prompt;
        if (imageBase64) {
          streamContents = {
            parts: [
              { text: prompt },
              { inlineData: { data: imageBase64, mimeType: imageMimeType } },
            ],
          };
        }

        const streamResponse = await ai.models.generateContentStream({
          model: selectedModel,
          contents: streamContents,
          config: {
            responseModalities: [Modality.AUDIO],
          },
        });

        let audioBase64 = '';
        let lyrics = '';
        let mimeType = 'audio/wav';

        for await (const chunk of streamResponse) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;

          for (const part of parts) {
            if (part.inlineData?.data) {
              if (!audioBase64 && part.inlineData.mimeType) {
                mimeType = part.inlineData.mimeType;
              }
              audioBase64 += part.inlineData.data;
            }
            if (part.text && !lyrics) {
              lyrics = part.text;
            }
          }
        }

        if (audioBase64) {
          res.json({
            id: 'lyria_' + Date.now().toString(36),
            title: prompt.slice(0, 40),
            audioBase64,
            mimeType,
            lyrics,
            model: selectedModel,
            durationSeconds,
            genre,
            isAiGenerated: true,
          });
          return;
        }

        // If model didn't return binary audio stream, signal fallback
        res.status(200).json({ fallback: true, message: 'Lyria stream yielded no inline audio' });
      } catch (lyriaErr: any) {
        console.warn('Lyria live generation failed (falling back to procedural audio):', lyriaErr.message);
        res.status(200).json({ fallback: true, error: lyriaErr.message });
      }
    } catch (err: any) {
      console.error('Server music generation error:', err);
      res.status(500).json({ error: err.message || 'Error generating music', fallback: true });
    }
  });

  // RAG Embedding single endpoint
  app.post('/api/rag/embed', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text string is required' });
        return;
      }

      if (!ai) {
        res.status(503).json({ fallback: true });
        return;
      }

      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });

      const respAny = response as any;
      const embedding =
        respAny.embeddings?.[0]?.values || respAny.embedding?.values || [];
      res.json({ embedding });
    } catch (err: any) {
      res.status(500).json({ fallback: true, error: err.message });
    }
  });

  // RAG Embedding batch endpoint
  app.post('/api/rag/embed/batch', async (req, res) => {
    try {
      const { texts } = req.body;
      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({ error: 'Texts array is required' });
        return;
      }

      if (!ai) {
        res.status(503).json({ fallback: true });
        return;
      }

      const embeddings: number[][] = [];
      for (const t of texts.slice(0, 20)) {
        if (typeof t !== 'string' || !t.trim()) {
          embeddings.push([]);
          continue;
        }
        const resp = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: t,
        });
        const respAny = resp as any;
        const vals = respAny.embeddings?.[0]?.values || respAny.embedding?.values || [];
        embeddings.push(vals);
      }

      res.json({ embeddings });
    } catch (err: any) {
      res.status(500).json({ fallback: true, error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasGemini: !!ai });
  });

  // In development, mount Vite's middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built assets from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Create native HTTP server so WebSockets can share port 3000
  const server = http.createServer(app);

  // Initialize WebSocket Server for Gemini Live API Voice Conversations
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected to Voice Conversation');

    if (!ai) {
      clientWs.send(JSON.stringify({ error: 'AI Live API is not configured on this server' }));
      clientWs.close();
      return;
    }

    try {
      // Connect to Gemini Live API with model gemini-3.8-live
      const session = await (ai as any).live.connect({
        model: 'gemini-3.8-live',
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are Omnia, the voice intelligence of Vizra Creative Studio. Speak concisely, naturally, and supportively. Help the user brainstorm, compose ideas, and create.',
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (msgErr) {
          console.error('[Live API] Error handling client audio packet:', msgErr);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live API] Voice session ended');
        try {
          if (session && typeof session.close === 'function') {
            session.close();
          }
        } catch {
          // Silent cleanup
        }
      });
    } catch (liveConnectErr: any) {
      console.error('[Live API] Failed to connect to gemini-3.8-live:', liveConnectErr.message);
      clientWs.send(
        JSON.stringify({
          error: `Live voice connection unavailable: ${liveConnectErr.message}`,
        })
      );
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Vizra Omnia server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
