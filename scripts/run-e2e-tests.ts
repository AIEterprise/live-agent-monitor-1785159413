import { globalRunner } from '../e2e/test-runner.ts';

// Import all 4 Tier Test Specs to register suites with globalRunner
import '../e2e/tier1-features.spec.ts';
import '../e2e/tier2-boundaries.spec.ts';
import '../e2e/tier3-combinations.spec.ts';
import '../e2e/tier4-scenarios.spec.ts';

async function main() {
  console.log('Starting E2E Test Suite for live_agent_monitor...');
  const result = await globalRunner.run();

  if (result.failed > 0) {
    console.error(`E2E Test Suite completed with ${result.failed} failure(s).`);
    process.exit(1);
  } else {
    console.log(`All ${result.passed} E2E tests across 4 Tiers passed successfully!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled error executing E2E test runner:', err);
  process.exit(1);
});
