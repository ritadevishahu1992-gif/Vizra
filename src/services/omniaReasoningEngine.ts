import {
  HumanizedConcept,
  LogicMemoryItem,
  KnowledgeGraphRelation,
  OmniaConflictItem,
  OmniaReasoningBundle,
} from '../types/omniaLearning';

export class OmniaReasoningEngine {
  /**
   * Evaluates user prompt against Knowledge Memory, Logic Memory, and Knowledge Graph.
   * Assembles a structured, logic-first reasoning context for the AI generation model.
   */
  public static evaluateReasoningContext(
    prompt: string,
    concepts: HumanizedConcept[],
    rules: LogicMemoryItem[],
    graphRelations: KnowledgeGraphRelation[],
    conflicts: OmniaConflictItem[] = []
  ): OmniaReasoningBundle {
    const lowerPrompt = prompt.toLowerCase();
    const promptWords = lowerPrompt
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // 1. Intent & Domain Identification
    let domain = 'General Inquiry';
    let queryIntent = 'Fact & Explanation Retrieval';

    if (/(how to|steps|procedure|workflow|guide|execute|run)/i.test(prompt)) {
      queryIntent = 'Procedural Execution';
    } else if (/(why|cause|reason|what happens if|rule|condition|unless)/i.test(prompt)) {
      queryIntent = 'Causal & Logical Rule Reasoning';
    } else if (/(compare|difference|versus|vs|distinction)/i.test(prompt)) {
      queryIntent = 'Comparative Analysis';
    } else if (/(fix|troubleshoot|error|bug|issue|jam|fail|conflict)/i.test(prompt)) {
      queryIntent = 'Diagnostic & Constraint Troubleshooting';
    }

    // 2. Knowledge Concept Retrieval & Scoring
    // STRICT RELEVANCE: Project/domain-specific concepts must strictly match the query's subject.
    // General queries (e.g. about India, science, history, geography) must NEVER pull dispenser or project files.
    const matchedConcepts: HumanizedConcept[] = [];
    for (const c of concepts) {
      if (c.status === 'REJECTED') continue;

      const cConceptWords = c.concept.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const cTopicWords = c.topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

      // Strict matching: at least 2 distinct words from the concept/topic must match, or the exact concept name must be in the prompt
      const exactConceptMatch = lowerPrompt.includes(c.concept.toLowerCase());
      const conceptWordsMatchCount = cConceptWords.filter((w) => lowerPrompt.includes(w)).length;
      const topicWordsMatchCount = cTopicWords.filter((w) => lowerPrompt.includes(w)).length;

      const isSubstantiveMatch = exactConceptMatch || conceptWordsMatchCount >= 2 || (conceptWordsMatchCount >= 1 && topicWordsMatchCount >= 1);

      if (isSubstantiveMatch) {
        matchedConcepts.push(c);
        if (c.topic) domain = c.topic;
      }
    }

    // Sort concepts by Level (high-level first) and Approval state
    matchedConcepts.sort((a, b) => {
      if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
      if (b.status === 'APPROVED' && a.status !== 'APPROVED') return 1;
      return (b.level || 1) - (a.level || 1);
    });

    // 3. Logic Memory & Rule Retrieval
    // Rules must only be included if the prompt is explicitly about the topic or rule entity
    const matchedRules: LogicMemoryItem[] = [];
    const matchedProcedures: LogicMemoryItem[] = [];

    if (matchedConcepts.length > 0 || /(dispenser|medicine|esp32|nema|carousel|pod|pill|kerr|singularity|film|black hole)/i.test(lowerPrompt)) {
      for (const r of rules) {
        if (r.status === 'REJECTED') continue;

        const rNameWords = r.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
        const rTopicWords = r.topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

        const ruleNameMatch = rNameWords.filter((w) => lowerPrompt.includes(w)).length >= 2 || lowerPrompt.includes(r.name.toLowerCase());
        const ruleTopicMatch = rTopicWords.filter((w) => lowerPrompt.includes(w)).length >= 2 || lowerPrompt.includes(r.topic.toLowerCase());

        if (ruleNameMatch || ruleTopicMatch) {
          if (r.logicType === 'PROCEDURE' || (r.steps && r.steps.length > 0)) {
            matchedProcedures.push(r);
          } else {
            matchedRules.push(r);
          }
        }
      }
    }

    // 4. Knowledge Graph Traversal
    const conceptNames = new Set(matchedConcepts.map((c) => c.concept.toLowerCase()));
    const matchedGraphRelations: KnowledgeGraphRelation[] = [];

    if (matchedConcepts.length > 0) {
      for (const rel of graphRelations) {
        const fromMatch = conceptNames.has(rel.fromConcept.toLowerCase());
        const toMatch = conceptNames.has(rel.toConcept.toLowerCase());

        if (fromMatch || toMatch) {
          matchedGraphRelations.push(rel);
        }
      }
    }

    // 5. Conflict & Uncertainty Checking
    // Strictly isolate: only attach conflict notes if the user's prompt is specifically asking about that conflicted topic
    const matchedConflicts: OmniaConflictItem[] = [];
    for (const conf of conflicts) {
      if (conf.status === 'UNRESOLVED') {
        const topicWords = conf.topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
        const matchTopicCount = topicWords.filter((w) => lowerPrompt.includes(w)).length;
        const exactTopicMatch = lowerPrompt.includes(conf.topic.toLowerCase());

        if (exactTopicMatch || matchTopicCount >= 2) {
          matchedConflicts.push(conf);
        }
      }
    }

    // 6. Assemble Structured Prompt Context for Gemini
    const reasoningGuidance: string[] = [];
    const contextSections: string[] = [];

    if (matchedConcepts.length > 0) {
      reasoningGuidance.push(`Grounded in ${matchedConcepts.length} verified Omnia concepts.`);
      const conceptBlock = matchedConcepts
        .slice(0, 3)
        .map(
          (c) =>
            `• CONCEPT [${c.concept}] (Level ${c.level}, Trust: ${c.confidence * 100}%):\n  - Simple explanation: ${c.simpleExplanation}\n  - Technical explanation: ${c.technicalExplanation}\n  - Practical meaning: ${c.practicalMeaning}${
              c.example ? `\n  - Example: ${c.example}` : ''
            }${
              c.commonMistakes && c.commonMistakes.length > 0
                ? `\n  - Common Pitfalls to avoid: ${c.commonMistakes.join('; ')}`
                : ''
            }`
        )
        .join('\n\n');

      contextSections.push(`[OMNIA KNOWLEDGE MEMORY — CONCEPTS & HUMANIZATION]\n${conceptBlock}`);
    }

    if (matchedRules.length > 0) {
      reasoningGuidance.push(`Enforce ${matchedRules.length} operational logic rules.`);
      const rulesBlock = matchedRules
        .slice(0, 4)
        .map(
          (r) =>
            `• ${r.logicType} [${r.name}]:\n  - Trigger: ${r.condition}\n  - Action/Inference: ${r.action}${
              r.exception ? `\n  - Exception: ${r.exception}` : ''
            }`
        )
        .join('\n');

      contextSections.push(`[OMNIA LOGIC MEMORY — ACTIVE RULES & INFERENCES]\n${rulesBlock}`);
    }

    if (matchedProcedures.length > 0) {
      reasoningGuidance.push(`Incorporate step-by-step procedures.`);
      const procBlock = matchedProcedures
        .slice(0, 2)
        .map((p) => {
          const stepsStr = (p.steps || [])
            .map((s) => `    ${s.step}. ${s.title}: ${s.action}`)
            .join('\n');
          return `• PROCEDURE [${p.name}]:\n  Condition: ${p.condition}\n  Steps:\n${stepsStr}`;
        })
        .join('\n\n');

      contextSections.push(`[OMNIA PROCEDURAL MEMORY — SEQUENTIAL METHODS]\n${procBlock}`);
    }

    if (matchedGraphRelations.length > 0) {
      const graphBlock = matchedGraphRelations
        .slice(0, 4)
        .map((g) => `  - (${g.fromConcept}) --[${g.relationType}]--> (${g.toConcept})${g.description ? `: ${g.description}` : ''}`)
        .join('\n');

      contextSections.push(`[OMNIA KNOWLEDGE GRAPH — RELATIONSHIPS]\n${graphBlock}`);
    }

    if (matchedConflicts.length > 0) {
      reasoningGuidance.push(`Address known divergence/conflict without inventing a false resolution.`);
      const conflictBlock = matchedConflicts
        .map(
          (cf) =>
            `• NOTICE: Unresolved specification divergence exists on "${cf.topic}".\n  - Perspective A (${cf.sourceATitle}): ${cf.statementA}\n  - Perspective B (${cf.sourceBTitle}): ${cf.statementB}\n  - Instruction: Explain the nuance between both specifications rather than declaring one unilaterally invalid.`
        )
        .join('\n');

      contextSections.push(`[OMNIA KNOWLEDGE GOVERNANCE — KNOWN CONFLICTS]\n${conflictBlock}`);
    }

    return {
      matchedConcepts,
      matchedRules,
      matchedProcedures,
      matchedGraphRelations,
      conflicts: matchedConflicts,
      reasoningGuidance,
      contextString: contextSections.join('\n\n'),
      queryIntent,
      domain,
    };
  }
}
