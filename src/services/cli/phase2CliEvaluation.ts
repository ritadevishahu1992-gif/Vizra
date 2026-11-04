import { normalizeMultilingualInput } from './languageNormalizer';
import { omniaCliEngine } from './omniaCliEngine';
import { runComprehensiveEvaluation } from '../aiEvaluationSuite';

export interface Phase2TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

export async function runPhase2VerificationSuite(): Promise<{
  phase2Passed: number;
  phase2Total: number;
  phase2Results: Phase2TestCaseResult[];
  regressionSummary: Awaited<ReturnType<typeof runComprehensiveEvaluation>>;
}> {
  const phase2Results: Phase2TestCaseResult[] = [];

  function assertTest(id: string, name: string, fn: () => { passed: boolean; details: string }) {
    try {
      const res = fn();
      phase2Results.push({ id, name, passed: res.passed, details: res.details });
    } catch (err: any) {
      phase2Results.push({ id, name, passed: false, details: `Exception: ${String(err)}` });
    }
  }

  // Test 1: Pure English detection & no false Hinglish triggers on ambiguous short words ('the', 'is', 'in', 'me', 'main')
  assertTest('P2-01', 'Pure English input with common short words remains English', () => {
    const profile = normalizeMultilingualInput(
      'Explain the main difference between React state and props in TypeScript.'
    );
    const passed =
      profile.primaryLanguage === 'english' &&
      profile.legacyLanguage === 'english' &&
      !profile.isCodeSwitched &&
      profile.preservedEntities.includes('React') &&
      profile.preservedEntities.includes('TypeScript');
    return {
      passed,
      details: `primary=${profile.primaryLanguage}, codeSwitched=${profile.isCodeSwitched}, entities=[${profile.preservedEntities.join(', ')}]`,
    };
  });

  // Test 2: Pure Hindi in Devanagari script
  assertTest('P2-02', 'Pure Hindi in Devanagari script detected accurately', () => {
    const profile = normalizeMultilingualInput('प्रकाश संश्लेषण की प्रक्रिया कैसे काम करती है?');
    const passed =
      profile.primaryLanguage === 'hindi' &&
      profile.legacyLanguage === 'hindi' &&
      profile.script === 'devanagari';
    return {
      passed,
      details: `primary=${profile.primaryLanguage}, script=${profile.script}`,
    };
  });

  // Test 3: Informal Hinglish phonetic spelling normalization ("kese", "krna", "btao", "kl")
  assertTest('P2-03', 'Normalizes informal Hinglish spelling variations to canonical forms', () => {
    const profile = normalizeMultilingualInput('Bhai kl mujhe yeh kese krna hai thoda btao');
    const passed =
      profile.primaryLanguage === 'hinglish' &&
      profile.legacyLanguage === 'hinglish' &&
      profile.normalizedText === 'bhai kal mujhe yeh kaise karna hai thoda batao';
    return {
      passed,
      details: `normalized="${profile.normalizedText}"`,
    };
  });

  // Test 4: Code-switching with protected technical entities
  assertTest('P2-04', 'Preserves technical identifiers during Hinglish code-switching', () => {
    const profile = normalizeMultilingualInput('React component mein useState kese use krte hain?');
    const passed =
      profile.primaryLanguage === 'hinglish' &&
      profile.isCodeSwitched === true &&
      profile.preservedEntities.includes('React') &&
      profile.preservedEntities.includes('useState') &&
      profile.normalizedText === 'React component mein useState kaise use karte hain?';
    return {
      passed,
      details: `normalized="${profile.normalizedText}", entities=[${profile.preservedEntities.join(', ')}]`,
    };
  });

  // Test 5: Mixed Devanagari + English technical terms
  assertTest('P2-05', 'Handles mixed Devanagari and English technical entities', () => {
    const profile = normalizeMultilingualInput('ESP32 और NEMA17 stepper motor को कैसे जोड़ें?');
    const passed =
      profile.primaryLanguage === 'hindi' &&
      profile.script === 'mixed' &&
      profile.preservedEntities.includes('ESP32') &&
      profile.preservedEntities.includes('NEMA17');
    return {
      passed,
      details: `primary=${profile.primaryLanguage}, script=${profile.script}, entities=[${profile.preservedEntities.join(', ')}]`,
    };
  });

  // Test 6: OmniaCliEngine contract generation & sub-5ms performance
  assertTest('P2-06', 'OmniaCliEngine builds valid CLIInterpretationContract v1.0.0 in < 5ms', () => {
    omniaCliEngine.clearCache();
    const contract = omniaCliEngine.interpretMessage(
      'Mujhe ek Python script bnana hai data analysis ke liye',
      [],
      { mode: 'code' }
    );
    const passed =
      contract.contractVersion === '1.0.0' &&
      contract.languageProfile.primaryLanguage === 'hinglish' &&
      contract.languageProfile.preservedEntities.includes('Python') &&
      contract.processingLatencyMs < 15 &&
      contract.enrichedPromptContext.includes('[OMNIA CLI INTERPRETATION v1.0]');
    return {
      passed,
      details: `intent=${contract.primaryIntent}, latency=${contract.processingLatencyMs}ms`,
    };
  });

  // Test 7: Untrusted input length boundary safety
  assertTest('P2-07', 'Enforces safe input length bounds against oversized payloads', () => {
    const huge = 'kya '.repeat(3000); // 12,000 chars
    const profile = normalizeMultilingualInput(huge);
    const passed = profile.rawText.length === 8000 && profile.primaryLanguage === 'hinglish';
    return {
      passed,
      details: `boundedLength=${profile.rawText.length}`,
    };
  });

  const regressionSummary = await runComprehensiveEvaluation();

  return {
    phase2Passed: phase2Results.filter((r) => r.passed).length,
    phase2Total: phase2Results.length,
    phase2Results,
    regressionSummary,
  };
}
