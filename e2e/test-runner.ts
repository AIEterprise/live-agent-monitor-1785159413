export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

class Expectation<T> {
  private actual: T;
  private isNegated = false;

  constructor(actual: T) {
    this.actual = actual;
  }

  get not(): Expectation<T> {
    const neg = new Expectation(this.actual);
    neg.isNegated = !this.isNegated;
    return neg;
  }

  toBe(expected: T): void {
    const pass = this.actual === expected;
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNegated ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
      );
    }
  }

  toEqual(expected: unknown): void {
    const actualJson = JSON.stringify(this.actual);
    const expectedJson = JSON.stringify(expected);
    const pass = actualJson === expectedJson;
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected ${actualJson} ${this.isNegated ? 'NOT to equal' : 'to equal'} ${expectedJson}`
      );
    }
  }

  toBeGreaterThan(expected: number): void {
    const act = Number(this.actual);
    const pass = act > expected;
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected ${act} ${this.isNegated ? 'NOT to be >' : 'to be >'} ${expected}`
      );
    }
  }

  toBeLessThan(expected: number): void {
    const act = Number(this.actual);
    const pass = act < expected;
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected ${act} ${this.isNegated ? 'NOT to be <' : 'to be <'} ${expected}`
      );
    }
  }

  toContain(item: unknown): void {
    let pass = false;
    if (typeof this.actual === 'string' && typeof item === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    }
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNegated ? 'NOT to contain' : 'to contain'} ${JSON.stringify(item)}`
      );
    }
  }

  toSatisfy(predicate: (val: T) => boolean, description: string = 'predicate condition'): void {
    const pass = predicate(this.actual);
    if (this.isNegated ? pass : !pass) {
      throw new AssertionError(
        `Expected value ${this.isNegated ? 'NOT to satisfy' : 'to satisfy'} ${description}`
      );
    }
  }

  toThrow(expectedPattern?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new AssertionError('expect(fn).toThrow() requires a function input');
    }
    let threw = false;
    let thrownError: unknown = null;
    try {
      (this.actual as () => void)();
    } catch (e) {
      threw = true;
      thrownError = e;
    }

    if (this.isNegated ? threw : !threw) {
      throw new AssertionError(
        `Expected function ${this.isNegated ? 'NOT to throw' : 'to throw an error'}`
      );
    }

    if (threw && expectedPattern && !this.isNegated) {
      const errStr = thrownError instanceof Error ? thrownError.message : String(thrownError);
      if (typeof expectedPattern === 'string') {
        if (!errStr.includes(expectedPattern)) {
          throw new AssertionError(
            `Expected thrown error message "${errStr}" to contain "${expectedPattern}"`
          );
        }
      } else if (expectedPattern instanceof RegExp) {
        if (!expectedPattern.test(errStr)) {
          throw new AssertionError(
            `Expected thrown error message "${errStr}" to match regex ${expectedPattern}`
          );
        }
      }
    }
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

export class TestRunner {
  private suites: { name: string; tests: { name: string; fn: () => void | Promise<void> }[] }[] = [];
  private currentSuiteName = 'Default Suite';

  describe(suiteName: string, fn: () => void): void {
    const prevSuite = this.currentSuiteName;
    this.currentSuiteName = suiteName;
    this.suites.push({ name: suiteName, tests: [] });
    fn();
    this.currentSuiteName = prevSuite;
  }

  it(testName: string, fn: () => void | Promise<void>): void {
    let suite = this.suites.find((s) => s.name === this.currentSuiteName);
    if (!suite) {
      suite = { name: this.currentSuiteName, tests: [] };
      this.suites.push(suite);
    }
    suite.tests.push({ name: testName, fn });
  }

  async run(): Promise<{ total: number; passed: number; failed: number; results: TestResult[] }> {
    const results: TestResult[] = [];
    let total = 0;
    let passed = 0;
    let failed = 0;

    const resetColor = '\x1b[0m';
    const green = '\x1b[32m';
    const red = '\x1b[31m';
    const cyan = '\x1b[36m';
    const gray = '\x1b[90m';
    const bold = '\x1b[1m';

    console.log(`\n${bold}${cyan}====================================================${resetColor}`);
    console.log(`${bold}${cyan}   LIVE AGENT MONITOR - E2E TEST RUNNER EXECUTION   ${resetColor}`);
    console.log(`${bold}${cyan}====================================================${resetColor}\n`);

    const startTime = Date.now();

    for (const suite of this.suites) {
      console.log(`${bold}${cyan}▶ Suite: ${suite.name}${resetColor}`);
      for (const test of suite.tests) {
        total++;
        const tStart = Date.now();
        try {
          await test.fn();
          const duration = Date.now() - tStart;
          passed++;
          results.push({
            suite: suite.name,
            name: test.name,
            passed: true,
            durationMs: duration,
          });
          console.log(`  ${green}✓${resetColor} ${test.name} ${gray}(${duration}ms)${resetColor}`);
        } catch (err: unknown) {
          const duration = Date.now() - tStart;
          failed++;
          const error = err instanceof Error ? err : new Error(String(err));
          results.push({
            suite: suite.name,
            name: test.name,
            passed: false,
            durationMs: duration,
            error,
          });
          console.log(`  ${red}✗ ${test.name} (${duration}ms)${resetColor}`);
          console.log(`    ${red}Error: ${error.message}${resetColor}`);
          if (error.stack) {
            const firstLines = error.stack.split('\n').slice(0, 4).join('\n    ');
            console.log(`    ${gray}${firstLines}${resetColor}`);
          }
        }
      }
      console.log('');
    }

    const totalDuration = Date.now() - startTime;

    console.log(`${bold}----------------------------------------------------${resetColor}`);
    console.log(
      `${bold}Test Execution Summary:${resetColor} Total: ${total} | Passed: ${green}${passed}${resetColor} | Failed: ${failed > 0 ? red + failed : green + '0'}${resetColor} | Time: ${totalDuration}ms`
    );
    console.log(`${bold}----------------------------------------------------${resetColor}\n`);

    return { total, passed, failed, results };
  }
}

export const globalRunner = new TestRunner();
export const describe = globalRunner.describe.bind(globalRunner);
export const it = globalRunner.it.bind(globalRunner);
