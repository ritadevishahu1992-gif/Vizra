import {
  HumanizedConcept,
  LogicMemoryItem,
  KnowledgeGraphRelation,
  LearningSource,
  LearningLevel,
  OmniaConflictItem,
} from '../types/omniaLearning';
import { computeStringHash } from '../utils/hashUtils';

export interface ExtractionResult {
  concepts: HumanizedConcept[];
  logicRules: LogicMemoryItem[];
  graphRelations: KnowledgeGraphRelation[];
  conflict?: OmniaConflictItem | null;
  validationScore: number;
  validationNotes: string[];
}

/**
 * Intelligent Extraction & Humanization Service for Omnia
 * Runs multi-stage analysis on raw text using Gemini AI or structured heuristic NLP fallback.
 */
export class OmniaIntelligenceService {
  /**
   * Main Pipeline: Extracts Humanized Concepts, Logic Rules, Procedures & Graph Triples
   */
  public static async processAndExtractKnowledge(
    source: LearningSource,
    existingConcepts: HumanizedConcept[],
    existingRules: LogicMemoryItem[],
    aiInstance?: any | null
  ): Promise<ExtractionResult> {
    // If Gemini is available on server, perform deep semantic extraction
    if (aiInstance) {
      try {
        const aiResult = await this.extractWithGemini(source, existingConcepts, existingRules, aiInstance);
        if (aiResult && aiResult.concepts.length > 0) {
          return aiResult;
        }
      } catch (err) {
        console.warn('Gemini extraction fallback to heuristic engine:', err);
      }
    }

    // Heuristic Rule-Based Deep Extraction Engine
    return this.extractWithHeuristics(source, existingConcepts, existingRules);
  }

  /**
   * Deep AI Extraction using Gemini Structured Prompting
   */
  private static async extractWithGemini(
    source: LearningSource,
    existingConcepts: HumanizedConcept[],
    existingRules: LogicMemoryItem[],
    ai: any
  ): Promise<ExtractionResult | null> {
    const prompt = `You are the Lead Knowledge Engineer for Vizra Omnia. Analyze the following source document and extract a structured intelligence breakdown.

Source Title: "${source.title}"
Source Type: "${source.sourceType}"
Trust Level: "${source.trustLevel}"

Content:
"""
${source.rawContent}
"""

Return a valid JSON object matching this schema:
{
  "concepts": [
    {
      "concept": "Name of primary concept",
      "topic": "Broad topic category",
      "subtopic": "Specific subtopic",
      "level": 1 to 6 (1: Basic, 2: Understanding, 3: Procedural, 4: Logical, 5: Advanced, 6: Expert),
      "simpleExplanation": "Intuitive, humanized explanation in simple language",
      "technicalExplanation": "Rigorous, technically precise explanation without destroying fidelity",
      "practicalMeaning": "What this means in practical everyday engineering or operation",
      "example": "Clear concrete example",
      "whenToUse": ["Scenario 1", "Scenario 2"],
      "whenNotToUse": ["Pitfall or bad scenario 1"],
      "commonMistakes": ["Frequent misconception or operational bug"],
      "facts": ["Fact 1", "Fact 2"],
      "relatedConcepts": ["Related concept 1", "Related concept 2"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "logicRules": [
    {
      "name": "Descriptive rule title",
      "topic": "Topic",
      "logicType": "RULE" | "IF_THEN" | "CAUSE_EFFECT" | "CONDITION_ACTION" | "PROCEDURE" | "EXCEPTION" | "DECISION_TREE" | "CONSTRAINT" | "DEPENDENCY",
      "condition": "IF [exact trigger or condition]",
      "action": "THEN [exact resultant action, calculation, or inference]",
      "exception": "UNLESS [exception condition, or null]",
      "steps": [
        { "step": 1, "title": "Step title", "action": "Action to perform", "expectedOutput": "Output" }
      ],
      "inputs": ["Input 1"],
      "outputs": ["Output 1"],
      "dependencies": ["Prerequisite 1"]
    }
  ],
  "graphRelations": [
    {
      "fromConcept": "Concept A",
      "relationType": "related_to" | "depends_on" | "causes" | "exception_to" | "implements" | "prerequisite_for",
      "toConcept": "Concept B",
      "description": "Why and how they are connected"
    }
  ]
}`;

    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    let response: any;
    for (const m of models) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        if (response && response.text) break;
      } catch (e: any) {
        // Continue to next model if quota limit or error
      }
    }

    if (!response || !response.text) {
      return null;
    }

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText);

    const now = new Date().toISOString();
    const sourceId = source.sourceId;

    const concepts: HumanizedConcept[] = (parsed.concepts || []).map((c: any, idx: number) => ({
      id: `c_${sourceId}_${idx}_${Date.now().toString(36)}`,
      topic: c.topic || source.title,
      subtopic: c.subtopic,
      concept: c.concept || source.title,
      level: (c.level >= 1 && c.level <= 6 ? c.level : 2) as LearningLevel,
      simpleExplanation: c.simpleExplanation || 'Core concept extracted from verified source.',
      technicalExplanation: c.technicalExplanation || source.rawContent.slice(0, 300),
      practicalMeaning: c.practicalMeaning || 'Applied in platform execution.',
      example: c.example || '',
      whenToUse: Array.isArray(c.whenToUse) ? c.whenToUse : [],
      whenNotToUse: Array.isArray(c.whenNotToUse) ? c.whenNotToUse : [],
      commonMistakes: Array.isArray(c.commonMistakes) ? c.commonMistakes : [],
      relatedConcepts: Array.isArray(c.relatedConcepts) ? c.relatedConcepts : [],
      facts: Array.isArray(c.facts) ? c.facts : [],
      rawKnowledge: source.rawContent,
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      confidence: source.trustLevel === 'verified_internal' ? 0.98 : source.trustLevel === 'official_doc' ? 0.95 : 0.88,
      status: 'APPROVED',
      version: source.version || 1,
      createdAt: now,
      updatedAt: now,
      tags: Array.isArray(c.tags) ? c.tags : [source.sourceType],
    }));

    const logicRules: LogicMemoryItem[] = (parsed.logicRules || []).map((r: any, idx: number) => ({
      id: `rule_${sourceId}_${idx}_${Date.now().toString(36)}`,
      topic: r.topic || source.title,
      name: r.name || `Rule ${idx + 1}`,
      logicType: r.logicType || 'IF_THEN',
      condition: r.condition || 'General condition',
      action: r.action || 'Applied action',
      exception: r.exception,
      steps: Array.isArray(r.steps) ? r.steps : undefined,
      inputs: Array.isArray(r.inputs) ? r.inputs : undefined,
      outputs: Array.isArray(r.outputs) ? r.outputs : undefined,
      dependencies: Array.isArray(r.dependencies) ? r.dependencies : undefined,
      sourceId: source.sourceId,
      status: 'APPROVED',
      confidence: 0.92,
      version: source.version || 1,
      createdAt: now,
      updatedAt: now,
    }));

    const graphRelations: KnowledgeGraphRelation[] = (parsed.graphRelations || []).map((g: any, idx: number) => ({
      id: `rel_${sourceId}_${idx}_${Date.now().toString(36)}`,
      fromConcept: g.fromConcept || source.title,
      relationType: g.relationType || 'related_to',
      toConcept: g.toConcept || 'Omnia Knowledge',
      description: g.description,
      sourceId: source.sourceId,
      confidence: 0.9,
      createdAt: now,
    }));

    // Contradiction Check
    const conflict = this.detectContradictionsWithExisting(source, concepts, logicRules, existingConcepts, existingRules);

    return {
      concepts,
      logicRules,
      graphRelations,
      conflict,
      validationScore: 95,
      validationNotes: ['Gemini multi-stage extraction and humanization complete.'],
    };
  }

  /**
   * Deterministic Heuristic Extraction Engine (Zero external dependency fallback)
   */
  private static extractWithHeuristics(
    source: LearningSource,
    existingConcepts: HumanizedConcept[],
    existingRules: LogicMemoryItem[]
  ): ExtractionResult {
    const raw = source.rawContent;
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);
    const now = new Date().toISOString();
    const sourceId = source.sourceId;

    const concepts: HumanizedConcept[] = [];
    const logicRules: LogicMemoryItem[] = [];
    const graphRelations: KnowledgeGraphRelation[] = [];

    // Extract Sections and Headers
    let currentTopic = source.title;
    const extractedFacts: string[] = [];
    const ruleLines: string[] = [];
    const stepLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        currentTopic = line.replace(/^#+\s*/, '');
      } else if (/^(if\s|when\s|rule:|constraint:|condition:)/i.test(line)) {
        ruleLines.push(line);
      } else if (/^(\d+\.|\*|-)\s+(step|procedure|action):?/i.test(line) || /^\d+\.\s+/.test(line)) {
        stepLines.push(line);
      } else if (line.length > 25 && !line.startsWith('#')) {
        extractedFacts.push(line.replace(/^[-*•]\s*/, ''));
      }
    }

    // Determine Level based on depth
    let level: LearningLevel = 2;
    if (stepLines.length > 2) level = 3;
    if (ruleLines.length > 0) level = 4;
    if (source.trustLevel === 'verified_internal' || source.trustLevel === 'official_doc') level = 5;

    // Build Primary Humanized Concept
    const primaryConcept: HumanizedConcept = {
      id: `c_${sourceId}_primary`,
      topic: source.title,
      subtopic: currentTopic !== source.title ? currentTopic : undefined,
      concept: source.title,
      level,
      simpleExplanation:
        extractedFacts.length > 0
          ? `${extractedFacts[0].slice(0, 180)}.`
          : `Core functional knowledge covering ${source.title}.`,
      technicalExplanation:
        raw.length > 400 ? raw.slice(0, 400) + '...' : raw,
      practicalMeaning: `Operational guidance for ${source.title} across Vizra workflows.`,
      example: extractedFacts.length > 1 ? extractedFacts[1] : 'Production deployment and query execution.',
      whenToUse: [
        `When evaluating parameters or behavior defined in ${source.title}`,
        'When verifying architectural compliance',
      ],
      whenNotToUse: [
        'When working outside the verified operational bounds of this domain',
      ],
      commonMistakes: [
        'Assuming unverified assumptions rather than adhering to explicit specifications',
      ],
      relatedConcepts: [source.sourceType, 'Omnia RAG', 'Continuous Learning'],
      facts: extractedFacts.slice(0, 5),
      rawKnowledge: raw,
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      confidence: source.trustLevel === 'verified_internal' ? 0.98 : source.trustLevel === 'official_doc' ? 0.95 : 0.85,
      status: source.status === 'CONFLICTED' ? 'CONFLICTED' : 'APPROVED',
      version: source.version || 1,
      createdAt: now,
      updatedAt: now,
      tags: [source.sourceType, 'humanized_v1'],
    };
    concepts.push(primaryConcept);

    // Extract Logic & Rules
    if (ruleLines.length > 0) {
      ruleLines.forEach((rl, idx) => {
        const parts = rl.split(/then|->|implies/i);
        const cond = parts[0] ? parts[0].trim() : rl;
        const act = parts[1] ? parts[1].trim() : 'Enforce specified protocol';

        logicRules.push({
          id: `rule_${sourceId}_${idx}`,
          topic: source.title,
          name: `${source.title} Rule ${idx + 1}`,
          logicType: 'IF_THEN',
          condition: cond.startsWith('IF') ? cond : `IF ${cond}`,
          action: act.startsWith('THEN') ? act : `THEN ${act}`,
          exception: rl.includes('UNLESS') ? rl.split('UNLESS')[1]?.trim() : undefined,
          sourceId,
          status: 'APPROVED',
          confidence: 0.9,
          version: source.version || 1,
          createdAt: now,
          updatedAt: now,
        });
      });
    } else {
      // Create foundational rule for the concept
      logicRules.push({
        id: `rule_${sourceId}_default`,
        topic: source.title,
        name: `${source.title} Application Rule`,
        logicType: 'RULE',
        condition: `IF querying or operating within domain of "${source.title}"`,
        action: `THEN strictly adhere to verified specifications in source v${source.version || 1}`,
        sourceId,
        status: 'APPROVED',
        confidence: 0.95,
        version: source.version || 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Extract Procedure if numbered steps exist
    if (stepLines.length > 0) {
      logicRules.push({
        id: `proc_${sourceId}_steps`,
        topic: source.title,
        name: `${source.title} Execution Procedure`,
        logicType: 'PROCEDURE',
        condition: `IF executing procedure for "${source.title}"`,
        action: 'THEN execute sequential operational steps',
        steps: stepLines.map((s, i) => ({
          step: i + 1,
          title: `Step ${i + 1}`,
          action: s.replace(/^\d+\.\s*/, ''),
          expectedOutput: 'Step completed successfully',
        })),
        sourceId,
        status: 'APPROVED',
        confidence: 0.94,
        version: source.version || 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Extract Knowledge Graph Triples
    graphRelations.push({
      id: `rel_${sourceId}_0`,
      fromConcept: source.title,
      relationType: 'implements',
      toConcept: 'Vizra Platform Architecture',
      description: 'Extends platform intelligence and reasoning logic',
      sourceId,
      confidence: 0.95,
      createdAt: now,
    });

    const conflict = this.detectContradictionsWithExisting(source, concepts, logicRules, existingConcepts, existingRules);

    return {
      concepts,
      logicRules,
      graphRelations,
      conflict,
      validationScore: 92,
      validationNotes: [
        `Heuristic extraction: ${concepts.length} concepts, ${logicRules.length} rules, ${graphRelations.length} relations.`,
      ],
    };
  }

  /**
   * Contradiction and Incompatibility Detector
   */
  private static detectContradictionsWithExisting(
    source: LearningSource,
    newConcepts: HumanizedConcept[],
    newRules: LogicMemoryItem[],
    existingConcepts: HumanizedConcept[],
    existingRules: LogicMemoryItem[]
  ): OmniaConflictItem | null {
    if (!existingConcepts || existingConcepts.length === 0) return null;

    for (const newC of newConcepts) {
      for (const existC of existingConcepts) {
        if (existC.id === newC.id || existC.sourceId === source.sourceId) continue;

        const isSameTopic =
          existC.concept.toLowerCase().includes(newC.concept.toLowerCase()) ||
          newC.concept.toLowerCase().includes(existC.concept.toLowerCase());

        if (isSameTopic) {
          // Check for numerical or factual divergence
          const hashNew = computeStringHash(newC.technicalExplanation);
          const hashExist = computeStringHash(existC.technicalExplanation);

          if (hashNew !== hashExist && newC.technicalExplanation.length > 40 && existC.technicalExplanation.length > 40) {
            // Check if there is an explicit numerical clash (e.g. 1200ms vs 800ms)
            const numbersNew: string[] = newC.technicalExplanation.match(/\d+/g) || [];
            const numbersExist: string[] = existC.technicalExplanation.match(/\d+/g) || [];

            const hasNumericalDisagreement =
              numbersNew.length > 0 &&
              numbersExist.length > 0 &&
              !numbersNew.some((n: string) => numbersExist.includes(n));

            if (hasNumericalDisagreement) {
              return {
                id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                sourceAId: existC.sourceId,
                sourceBId: source.sourceId,
                sourceATitle: existC.concept,
                sourceBTitle: newC.concept,
                topic: newC.concept,
                statementA: existC.technicalExplanation.slice(0, 300),
                statementB: newC.technicalExplanation.slice(0, 300),
                detectedAt: new Date().toISOString(),
                resolutionRule: 'MANUAL_REVIEW',
                status: 'UNRESOLVED',
                resolutionNotes: 'Numerical or specification divergence detected between verified sources.',
              };
            }
          }
        }
      }
    }

    return null;
  }
}
