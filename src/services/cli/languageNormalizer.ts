import {
  CLILanguageCode,
  CLILanguageProfile,
  CLIScriptType,
  CLITokenSpan,
  CLITokenTag,
} from '../../types/cli';

/**
 * OMNIA CLI — LAYER 1: MULTILINGUAL, HINGLISH & CODE-SWITCHING NORMALIZER
 *
 * Responsibilities:
 * 1. Detect English, Hindi (Devanagari), Hinglish (Roman Hindi), and Mixed-language code-switching.
 * 2. Normalize informal Roman Hindi / Hinglish spelling variations into canonical tokens
 *    (e.g., "kese" -> "kaise", "krna" -> "karna", "btao" -> "batao", "kl" -> "kal").
 * 3. Preserve technical identifiers, frameworks, URLs, file names, and inline code without distortion.
 * 4. Produce a semantic gloss and token-level linguistic profile in < 1ms.
 */

const MAX_SAFE_INPUT_LENGTH = 8000;

/**
 * Canonical normalization map for informal Hinglish / Roman Hindi spelling variations
 */
const HINGLISH_SPELLING_MAP: Readonly<Record<string, string>> = {
  // Interrogatives & connectors
  kese: 'kaise',
  kaisa: 'kaise',
  kaisi: 'kaise',
  kyu: 'kyun',
  kyun: 'kyun',
  kyo: 'kyun',
  kyon: 'kyun',
  kya: 'kya',
  kaha: 'kahan',
  kha: 'kahan',
  kahan: 'kahan',
  kb: 'kab',
  kab: 'kab',
  kaun: 'kaun',
  kon: 'kaun',
  konsa: 'kaunsa',
  kaunsa: 'kaunsa',
  kitna: 'kitna',
  kitne: 'kitne',

  // Verbs & auxiliaries
  kr: 'kar',
  kro: 'karo',
  karo: 'karo',
  krna: 'karna',
  karna: 'karna',
  krne: 'karne',
  karne: 'karne',
  kre: 'karein',
  kare: 'karein',
  karein: 'karein',
  krte: 'karte',
  karte: 'karte',
  krta: 'karta',
  karta: 'karta',
  kiya: 'kiya',
  kia: 'kiya',
  btao: 'batao',
  batao: 'batao',
  btaiye: 'bataiye',
  bataiye: 'bataiye',
  btana: 'batana',
  batana: 'batana',
  bnao: 'banao',
  banao: 'banao',
  bnana: 'banana',
  bnane: 'banane',
  banane: 'banane',
  bnaya: 'banaya',
  banaya: 'banaya',
  smjh: 'samajh',
  samajh: 'samajh',
  smjhao: 'samjhao',
  samjhao: 'samjhao',
  smjhana: 'samjhana',
  samjhana: 'samjhana',
  likho: 'likho',
  likhna: 'likhna',
  dikhao: 'dikhao',
  dekho: 'dekho',
  chahiye: 'chahiye',
  chaiye: 'chahiye',
  chahie: 'chahiye',
  hota: 'hota',
  hoti: 'hoti',
  hote: 'hote',
  hai: 'hai',
  hain: 'hain',
  he: 'hai', // contextual check applied before mapping 'he'
  ho: 'ho',
  tha: 'tha',
  thi: 'thi',
  the: 'the', // contextual check applied before mapping 'the'
  hoga: 'hoga',
  hogi: 'hogi',
  honge: 'honge',
  hua: 'hua',
  hui: 'hui',
  gya: 'gaya',
  gaya: 'gaya',
  gyi: 'gayi',
  gayi: 'gayi',
  gye: 'gaye',
  gaye: 'gaye',
  jaana: 'jaana',
  jana: 'jaana',
  aana: 'aana',
  ana: 'aana',
  rha: 'raha',
  raha: 'raha',
  rhi: 'rahi',
  rahi: 'rahi',
  rhe: 'rahe',
  rahe: 'rahe',
  skta: 'sakta',
  sakta: 'sakta',
  skte: 'sakte',
  sakte: 'sakte',
  skti: 'sakti',
  sakti: 'sakti',

  // Pronouns & postpositions
  main: 'main',
  mai: 'main',
  mein: 'mein',
  me: 'mein', // contextual check applied before mapping 'me'
  mujhe: 'mujhe',
  mujhko: 'mujhe',
  mjhe: 'mujhe',
  mera: 'mera',
  meri: 'meri',
  mere: 'mere',
  hum: 'hum',
  hme: 'humein',
  hume: 'humein',
  humein: 'humein',
  hamara: 'hamara',
  tum: 'tum',
  tm: 'tum',
  tumhe: 'tumhein',
  tumhara: 'tumhara',
  aap: 'aap',
  apko: 'aapko',
  aapko: 'aapko',
  apka: 'aapka',
  aapka: 'aapka',
  yeh: 'yeh',
  ye: 'yeh',
  woh: 'woh',
  wo: 'woh',
  iska: 'iska',
  iski: 'iski',
  iske: 'iske',
  isko: 'isko',
  isse: 'isse',
  isme: 'ismein',
  ismein: 'ismein',
  uska: 'uska',
  uski: 'uski',
  uske: 'uske',
  usko: 'usko',
  usse: 'usse',
  usme: 'usmein',
  usmein: 'usmein',
  unhone: 'unhone',
  inhone: 'inhone',
  kisi: 'kisi',
  kuch: 'kuch',
  kch: 'kuch',
  sab: 'sab',
  sb: 'sab',
  ka: 'ka',
  ki: 'ki',
  ke: 'ke',
  ko: 'ko',
  se: 'se',
  par: 'par',
  pr: 'par',
  pe: 'par',
  liye: 'liye',
  baare: 'baare',
  bare: 'baare',
  sath: 'saath',
  saath: 'saath',
  andar: 'andar',
  bahar: 'bahar',
  aage: 'aage',
  peeche: 'peeche',

  // Temporal & common modifiers
  kl: 'kal',
  kal: 'kal',
  aaj: 'aaj',
  aj: 'aaj',
  prso: 'parso',
  parso: 'parso',
  parson: 'parso',
  abhi: 'abhi',
  abi: 'abhi',
  baad: 'baad',
  pehle: 'pehle',
  phle: 'pehle',
  pahle: 'pehle',
  thoda: 'thoda',
  thodi: 'thodi',
  bahut: 'bahut',
  bohot: 'bahut',
  bht: 'bahut',
  zyada: 'zyada',
  jyada: 'zyada',
  achha: 'accha',
  acha: 'accha',
  accha: 'accha',
  sahi: 'sahi',
  galat: 'galat',
  jaldi: 'jaldi',
  jldi: 'jaldi',
  naya: 'naya',
  nayi: 'nayi',
  purana: 'purana',
  aur: 'aur',
  ya: 'ya',
  lekin: 'lekin',
  magar: 'magar',
  agar: 'agar',
  agr: 'agar',
  toh: 'toh',
  bhi: 'bhi',
  nhi: 'nahi',
  nahi: 'nahi',
  na: 'na',
  haan: 'haan',
  han: 'haan',
  bhai: 'bhai',
  yaar: 'yaar',
  dost: 'dost',
  namaste: 'namaste',
  shukriya: 'shukriya',
  dhanyawad: 'dhanyawad',

  // Common Hindi/Hinglish nouns & polysemous words
  paisa: 'paisa',
  paise: 'paise',
  sona: 'sona',
  aam: 'aam',
  uttar: 'uttar',
  haar: 'haar',
  fal: 'fal',
  phal: 'fal',
  ras: 'ras',
  nadi: 'nadi',
  kinara: 'kinara',
  dimag: 'dimag',
  dahi: 'dahi',
  jugaad: 'jugaad',
  jugad: 'jugaad',
  panga: 'panga',
  bhaukaal: 'bhaukaal',
  kamal: 'kamaal',
  kamaal: 'kamaal',
  fod: 'fod',
  phod: 'fod',
  diya: 'diya',
};

/**
 * Core set of unambiguous Roman Hindi / Hinglish lexical markers
 */
const CORE_HINGLISH_MARKERS = new Set<string>([
  'kya', 'kaise', 'kyun', 'kahan', 'kab', 'kaun', 'kaunsa', 'kitna', 'kitne',
  'karo', 'karna', 'karne', 'karein', 'karte', 'karta', 'kiya',
  'batao', 'bataiye', 'batana', 'banao', 'banane', 'banaya',
  'samajh', 'samjhao', 'samjhana', 'likho', 'likhna', 'dikhao', 'dekho',
  'chahiye', 'hota', 'hoti', 'hote', 'hai', 'hain', 'tha', 'thi', 'hoga', 'hogi',
  'hua', 'hui', 'gaya', 'gayi', 'gaye', 'jaana', 'aana', 'raha', 'rahi', 'rahe',
  'sakta', 'sakte', 'sakti', 'mujhe', 'mera', 'meri', 'mere', 'humein', 'hamara',
  'tum', 'tumhein', 'tumhara', 'aap', 'aapko', 'aapka', 'yeh', 'woh',
  'iska', 'iski', 'iske', 'isko', 'isse', 'ismein', 'uska', 'uski', 'uske', 'usko', 'usse', 'usmein',
  'unhone', 'inhone', 'kisi', 'kuch', 'sab', 'ka', 'ki', 'ke', 'ko', 'se', 'par', 'liye',
  'baare', 'saath', 'andar', 'bahar', 'aage', 'peeche',
  'kal', 'aaj', 'parso', 'abhi', 'baad', 'pehle', 'thoda', 'bahut', 'zyada',
  'accha', 'sahi', 'galat', 'jaldi', 'naya', 'nayi', 'purana', 'aur', 'lekin', 'magar',
  'agar', 'toh', 'bhi', 'nahi', 'haan', 'bhai', 'yaar', 'namaste', 'shukriya', 'dhanyawad',
  'paisa', 'paise', 'sona', 'aam', 'uttar', 'haar', 'fal', 'ras', 'nadi', 'kinara',
  'dimag', 'dahi', 'jugaad', 'panga', 'bhaukaal', 'kamaal',
]);

/**
 * Words that look identical in English and Roman Hindi ('he', 'me', 'the', 'to', 'is', 'in', 'or', 'us', 'main')
 * Only treat them as Hinglish when surrounded by other Hinglish tokens.
 */
const AMBIGUOUS_BILINGUAL_SHORT_WORDS = new Set<string>([
  'he', 'me', 'the', 'to', 'is', 'in', 'or', 'us', 'main', 'par', 'na', 'ho', 'se',
]);

/**
 * English semantic glosses for high-frequency Roman Hindi tokens to aid downstream semantic & intent engines
 */
const HINGLISH_TO_ENGLISH_GLOSS: Readonly<Record<string, string>> = {
  kya: 'what',
  kaise: 'how',
  kyun: 'why',
  kahan: 'where',
  kab: 'when',
  kaun: 'who',
  kitna: 'how much',
  batao: 'explain/tell',
  bataiye: 'explain/tell',
  samjhao: 'explain',
  banao: 'create/build',
  banana: 'create/build',
  likho: 'write',
  dikhao: 'show',
  chahiye: 'need/want',
  mujhe: 'I/to me',
  humein: 'we/to us',
  aap: 'you',
  tum: 'you',
  yeh: 'this',
  woh: 'that/it',
  iska: 'its/of this',
  uska: 'its/of that',
  ismein: 'in this',
  usmein: 'in that',
  unhone: 'they',
  kal: 'yesterday/tomorrow',
  aaj: 'today',
  parso: 'day before yesterday/day after tomorrow',
  abhi: 'right now',
  pehle: 'before/earlier',
  baad: 'after/later',
  nahi: 'not',
  haan: 'yes',
  aur: 'and/more',
  aage: 'next/continue',
  baare: 'about',
};

/**
 * Protected technical, scientific, and platform terms that must never be altered by transliteration
 */
const PROTECTED_TECH_ENTITIES = new Set<string>([
  'vizra', 'omnia', 'react', 'vue', 'angular', 'svelte', 'nextjs', 'vite', 'typescript',
  'javascript', 'python', 'java', 'rust', 'golang', 'nodejs', 'express', 'tailwind',
  'firestore', 'firebase', 'supabase', 'postgres', 'sql', 'graphql', 'docker', 'kubernetes',
  'arduino', 'esp32', 'nema17', 'nema', 'ds3231', 'alphafold', 'pubchem', 'pubmed', 'uniprot',
  'lyria', 'gemini', 'threejs', 'webgl', 'glsl', 'html', 'css', 'json', 'csv', 'pdf', 'api',
  'sdk', 'cli', 'ui', 'ux', 'rag', 'llm', 'nlp', 'wsd', 'jwt', 'oauth', 'github', 'git',
  'usestate', 'useeffect', 'useref', 'usememo', 'usecallback', 'abortcontroller',
]);

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const URL_OR_PATH_REGEX = /^(https?:\/\/\S+|www\.\S+|\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_./-]+|[a-zA-Z0-9_-]+\.(tsx|ts|js|jsx|py|md|json|csv|pdf|png|jpg|jpeg|svg))$/i;
const INLINE_CODE_LITERAL_REGEX = /^(`[^`]+`|[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)|[a-z]+[A-Z][a-zA-Z0-9]*)$/;

/**
 * Detects whether a raw token is a protected technical entity, camelCase symbol, URL, or code literal
 */
function isProtectedTechnicalToken(rawToken: string): boolean {
  const clean = rawToken.replace(/^[([{'"`]+|[)\]}'"`,.!?;:]+$/g, '');
  if (!clean) return false;
  if (PROTECTED_TECH_ENTITIES.has(clean.toLowerCase())) return true;
  if (URL_OR_PATH_REGEX.test(clean)) return true;
  if (INLINE_CODE_LITERAL_REGEX.test(clean)) return true;
  // CamelCase or PascalCase with digits/underscores (e.g., sendMessage, ChatMessage, p53, TP53)
  if (/[a-z][A-Z]/.test(clean) || /[A-Za-z]+\d+/.test(clean) || clean.includes('_')) {
    return true;
  }
  return false;
}

/**
 * Layer 1 Main Entry Point: Normalizes multilingual/Hinglish input and builds a complete CLILanguageProfile
 */
export function normalizeMultilingualInput(rawInput: string): CLILanguageProfile {
  const safeRaw = typeof rawInput === 'string' ? rawInput.slice(0, MAX_SAFE_INPUT_LENGTH) : '';
  const trimmed = safeRaw.trim();

  if (!trimmed) {
    return {
      primaryLanguage: 'english',
      legacyLanguage: 'english',
      script: 'latin',
      isCodeSwitched: false,
      confidence: 1.0,
      rawText: safeRaw,
      normalizedText: '',
      semanticGlossText: '',
      tokens: [],
      preservedEntities: [],
    };
  }

  // Split whitespace while keeping tokens inspectable
  const rawWords = trimmed.split(/\s+/);

  // First pass: count unambiguous Devanagari and Hinglish signals so ambiguous short words ('main', 'he', 'me', 'the')
  // are only normalized when the sentence is genuinely Hindi/Hinglish.
  let devanagariCount = 0;
  let unambiguousHinglishCount = 0;
  let latinWordCount = 0;

  for (const w of rawWords) {
    const stripped = w.replace(/^[^a-zA-Z0-9\u0900-\u097F]+|[^a-zA-Z0-9\u0900-\u097F]+$/g, '');
    if (!stripped) continue;

    if (DEVANAGARI_REGEX.test(stripped)) {
      devanagariCount++;
      continue;
    }

    if (/^[a-zA-Z]+$/.test(stripped)) {
      latinWordCount++;
      const low = stripped.toLowerCase();
      if (!AMBIGUOUS_BILINGUAL_SHORT_WORDS.has(low)) {
        const mapped = HINGLISH_SPELLING_MAP[low] || low;
        if (CORE_HINGLISH_MARKERS.has(mapped)) {
          unambiguousHinglishCount++;
        }
      }
    }
  }

  const hasStrongHinglishContext = unambiguousHinglishCount >= 2 || (unambiguousHinglishCount >= 1 && latinWordCount <= 3);

  // Second pass: build token spans, normalize Hinglish variants, and preserve technical entities
  const tokens: CLITokenSpan[] = [];
  const preservedEntities: string[] = [];
  const normalizedWords: string[] = [];
  const glossWords: string[] = [];

  let finalHiDevaTokens = 0;
  let finalHiLatnTokens = 0;
  let finalEnTokens = 0;

  rawWords.forEach((rawWord, idx) => {
    const leadingPunctMatch = rawWord.match(/^([^a-zA-Z0-9\u0900-\u097F]+)/);
    const trailingPunctMatch = rawWord.match(/([^a-zA-Z0-9\u0900-\u097F]+)$/);
    const leadingPunct = leadingPunctMatch ? leadingPunctMatch[1] : '';
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[1] : '';
    const core = rawWord.slice(
      leadingPunct.length,
      rawWord.length - (trailingPunct.length > 0 && trailingPunct.length < rawWord.length ? trailingPunct.length : 0)
    );

    if (!core) {
      tokens.push({
        raw: rawWord,
        normalized: rawWord,
        lower: rawWord.toLowerCase(),
        tag: 'punctuation',
        index: idx,
        wasNormalized: false,
      });
      normalizedWords.push(rawWord);
      glossWords.push(rawWord);
      return;
    }

    // 1. Check Devanagari script
    if (DEVANAGARI_REGEX.test(core)) {
      finalHiDevaTokens++;
      tokens.push({
        raw: rawWord,
        normalized: rawWord,
        lower: core.toLowerCase(),
        tag: 'hi_deva',
        index: idx,
        wasNormalized: false,
      });
      normalizedWords.push(rawWord);
      glossWords.push(rawWord);
      return;
    }

    // 2. Check numeric literal
    if (/^\d+([.,]\d+)?$/.test(core)) {
      tokens.push({
        raw: rawWord,
        normalized: rawWord,
        lower: core,
        tag: 'number',
        index: idx,
        wasNormalized: false,
      });
      normalizedWords.push(rawWord);
      glossWords.push(rawWord);
      return;
    }

    // 3. Check protected technical entity / URL / code identifier
    if (isProtectedTechnicalToken(rawWord)) {
      const tag: CLITokenTag = URL_OR_PATH_REGEX.test(core)
        ? 'url_or_path'
        : INLINE_CODE_LITERAL_REGEX.test(rawWord)
        ? 'code_literal'
        : 'tech_entity';

      if (!preservedEntities.includes(core)) {
        preservedEntities.push(core);
      }

      tokens.push({
        raw: rawWord,
        normalized: rawWord,
        lower: core.toLowerCase(),
        tag,
        index: idx,
        wasNormalized: false,
      });
      normalizedWords.push(rawWord);
      glossWords.push(rawWord);
      return;
    }

    // 4. Evaluate Latin word for Hinglish vs English
    const lowerCore = core.toLowerCase();
    const isAmbiguousShort = AMBIGUOUS_BILINGUAL_SHORT_WORDS.has(lowerCore);

    if (!isAmbiguousShort || hasStrongHinglishContext) {
      const canonical = HINGLISH_SPELLING_MAP[lowerCore];
      if (canonical && CORE_HINGLISH_MARKERS.has(canonical)) {
        finalHiLatnTokens++;
        const rebuilt = `${leadingPunct}${canonical}${trailingPunct}`;
        const gloss = HINGLISH_TO_ENGLISH_GLOSS[canonical] || canonical;
        tokens.push({
          raw: rawWord,
          normalized: rebuilt,
          lower: canonical,
          tag: 'hi_latn',
          index: idx,
          wasNormalized: canonical !== lowerCore,
        });
        normalizedWords.push(rebuilt);
        glossWords.push(`${leadingPunct}${gloss}${trailingPunct}`);
        return;
      }
    }

    // Default to English token
    finalEnTokens++;
    tokens.push({
      raw: rawWord,
      normalized: rawWord,
      lower: lowerCore,
      tag: 'en',
      index: idx,
      wasNormalized: false,
    });
    normalizedWords.push(rawWord);
    glossWords.push(rawWord);
  });

  // Determine script type
  let script: CLIScriptType = 'latin';
  if (finalHiDevaTokens > 0 && (finalEnTokens > 0 || finalHiLatnTokens > 0)) {
    script = 'mixed';
  } else if (finalHiDevaTokens > 0) {
    script = 'devanagari';
  } else if (finalEnTokens === 0 && finalHiLatnTokens === 0) {
    script = 'numeric_or_symbol';
  }

  // Determine Primary, Secondary & Legacy Language
  let primaryLanguage: CLILanguageCode = 'english';
  let secondaryLanguage: CLILanguageCode | undefined;
  let legacyLanguage: 'english' | 'hindi' | 'hinglish' = 'english';
  let isCodeSwitched = false;
  let confidence = 0.95;

  if (finalHiDevaTokens > 0) {
    primaryLanguage = 'hindi';
    legacyLanguage = 'hindi';
    if (finalEnTokens >= 2) {
      isCodeSwitched = true;
      secondaryLanguage = 'english';
    }
    confidence = 0.98;
  } else if (finalHiLatnTokens >= 2 || (finalHiLatnTokens === 1 && finalEnTokens === 0)) {
    if (finalEnTokens >= 2) {
      primaryLanguage = 'hinglish';
      secondaryLanguage = 'english';
      legacyLanguage = 'hinglish';
      isCodeSwitched = true;
      confidence = 0.94;
    } else {
      primaryLanguage = 'hinglish';
      legacyLanguage = 'hinglish';
      isCodeSwitched = finalEnTokens > 0;
      confidence = 0.96;
    }
  } else if (finalHiLatnTokens === 1 && finalEnTokens >= 1) {
    // Single high-salience Hinglish word mixed with English (e.g. "kya difference hai" or "explain karo")
    const hasHighSalienceMarker = tokens.some(
      (t) =>
        t.tag === 'hi_latn' &&
        /^(kya|kaise|kyun|karo|batao|samjhao|banao|chahiye|mujhe|kal|parso|nahi|haan|bhai|yaar|namaste)$/.test(
          t.lower
        )
    );
    if (hasHighSalienceMarker) {
      primaryLanguage = 'hinglish';
      secondaryLanguage = 'english';
      legacyLanguage = 'hinglish';
      isCodeSwitched = true;
      confidence = 0.88;
    }
  }

  return {
    primaryLanguage,
    legacyLanguage,
    secondaryLanguage,
    script,
    isCodeSwitched,
    confidence,
    rawText: safeRaw,
    normalizedText: normalizedWords.join(' '),
    semanticGlossText: glossWords.join(' '),
    tokens,
    preservedEntities,
  };
}
