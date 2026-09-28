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
    const matchedConcepts: HumanizedConcept[] = [];
    for (const c of concepts) {
      if (c.status === 'REJECTED') continue;

      const cConceptWords = c.concept.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const cTopicWords = c.topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

      const conceptDirectMatch = cConceptWords.some((w) => lowerPrompt.includes(w));
      const topicDirectMatch = cTopicWords.some((w) => lowerPrompt.includes(w));
      const tagMatch = (c.tags || []).some((t) => lowerPrompt.includes(t.toLowerCase()));
      const factMatch = (c.facts || []).some((f) =>
        f.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3).some((w) => lowerPrompt.includes(w))
      );
      const contentMatch = (c.simpleExplanation + ' ' + c.technicalExplanation)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3)
        .filter((w) => lowerPrompt.includes(w)).length >= 2;

      if (conceptDirectMatch || topicDirectMatch || tagMatch || factMatch || contentMatch) {
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
    const matchedRules: LogicMemoryItem[] = [];
    const matchedProcedures: LogicMemoryItem[] = [];

    for (const r of rules) {
      if (r.status === 'REJECTED') continue;

      const rNameWords = r.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const rTopicWords = r.topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const rCondWords = r.condition.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
      const rActWords = r.action.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);

      const ruleNameMatch = rNameWords.some((w) => lowerPrompt.includes(w));
      const ruleTopicMatch = rTopicWords.some((w) => lowerPrompt.includes(w));
      const condMatch = rCondWords.some((w) => lowerPrompt.includes(w));
      const actMatch = rActWords.some((w) => lowerPrompt.includes(w));

      if (ruleNameMatch || ruleTopicMatch || condMatch || actMatch) {
        if (r.logicType === 'PROCEDURE' || (r.steps && r.steps.length > 0)) {
          matchedProcedures.push(r);
        } else {
          matchedRules.push(r);
        }
      }
    }

    // 4. Knowledge Graph Traversal
    const conceptNames = new Set(matchedConcepts.map((c) => c.concept.toLowerCase()));
    const matchedGraphRelations: KnowledgeGraphRelation[] = [];

    for (const rel of graphRelations) {
      const fromMatch = conceptNames.has(rel.fromConcept.toLowerCase()) || promptWords.some((w) => rel.fromConcept.toLowerCase().includes(w));
      const toMatch = conceptNames.has(rel.toConcept.toLowerCase()) || promptWords.some((w) => rel.toConcept.toLowerCase().includes(w));

      if (fromMatch || toMatch) {
        matchedGraphRelations.push(rel);
      }
    }

    // 5. Conflict & Uncertainty Checking
    const matchedConflicts: OmniaConflictItem[] = [];
    for (const conf of conflicts) {
      if (conf.status === 'UNRESOLVED') {
        const matchA = promptWords.some((w) => conf.sourceATitle.toLowerCase().includes(w));
        const matchB = promptWords.some((w) => conf.sourceBTitle.toLowerCase().includes(w));
        const matchTopic = promptWords.some((w) => conf.topic.toLowerCase().includes(w));

        if (matchA || matchB || matchTopic) {
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
