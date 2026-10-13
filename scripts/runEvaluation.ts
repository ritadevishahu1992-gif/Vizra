import { runComprehensiveEvaluation } from '../src/services/aiEvaluationSuite';
import { runProductionSecurityEvaluation } from './productionSecurityTest';

async function main() {
  console.log('====================================================');
  console.log('  VIZRA / OMNIA 1.0 — COMPREHENSIVE PRODUCTION GATES');
  console.log('====================================================\n');

  try {
    const aiSummary = await runComprehensiveEvaluation();
    const securityResults = await runProductionSecurityEvaluation();

    const allResults = [...aiSummary.results, ...securityResults];

    let currentSuite = '';
    for (const test of allResults) {
      if (test.suite !== currentSuite) {
        currentSuite = test.suite;
        console.log(`\n--- [${currentSuite}] ---`);
      }
      const icon = test.passed ? '✓' : '✗';
      const status = test.passed ? 'PASS' : 'FAIL';
      console.log(`  ${icon} [${status}] ${test.name} (${test.durationMs}ms)`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    }

    const totalTests = allResults.length;
    const passedCount = allResults.filter((t) => t.passed).length;
    const failedCount = totalTests - passedCount;
    const passRate = `${Math.round((passedCount / totalTests) * 100)}%`;

    console.log('\n====================================================');
    console.log('  PRODUCTION READINESS & EVALUATION SUMMARY');
    console.log('====================================================');
    console.log(`  Total Quality Gates : ${totalTests}`);
    console.log(`  Passed              : ${passedCount}`);
    console.log(`  Failed              : ${failedCount}`);
    console.log(`  Pass Rate           : ${passRate}`);
    console.log(`  Duration            : ${aiSummary.durationMs}ms`);
    console.log('====================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal evaluation runner error:', err);
    process.exit(1);
  }
}

main();
