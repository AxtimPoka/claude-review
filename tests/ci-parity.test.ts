import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// `npm run check` and `ci.yml` hold the same list of gates in two places, and
// they are kept in step by hand. The docs gate was added to the first and
// forgotten in the second, and the pull request that added it claimed CI would
// run it. It did not: `ci.yml` calls the scripts one by one, on purpose, so
// that one failure does not hide the others.
//
// This test is the only thing that compares the two lists. It lives in
// `tests/` rather than in the docs checker because `npm test` is a gate CI
// definitely runs -- which is the whole point of the mistake it guards.
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');

/** The gates `npm run check` chains, in order. */
const chained = [...pkg.scripts.check!.matchAll(/npm (?:run )?([\w:]+)/g)].map((m) => m[1]!);

/** The npm scripts `ci.yml` actually runs, as steps. */
const inCi = [...ci.matchAll(/^\s*run: npm (?:run )?([\w:]+)\s*$/gm)].map((m) => m[1]!);

describe('every gate in npm run check also runs in CI', () => {
  it('finds the gates in both files', () => {
    // If either list comes back empty the comparison below would pass for the
    // wrong reason, so prove both were parsed first.
    expect(chained.length).toBeGreaterThan(1);
    expect(inCi.length).toBeGreaterThan(1);
  });

  it('runs every chained gate as a CI step', () => {
    const missing = chained.filter((g) => !inCi.includes(g));
    expect(missing).toEqual([]);
  });

  it('does not run a CI step that npm run check leaves out', () => {
    // The other direction matters too: a gate only in CI cannot be reproduced
    // locally, so an author cannot tell before pushing whether it will pass.
    const extra = inCi.filter((g) => g !== 'ci' && !chained.includes(g));
    expect(extra).toEqual([]);
  });
});
