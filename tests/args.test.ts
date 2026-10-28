import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args.js';

describe('parseArgs', () => {
  it('leaves argv alone when --file is not used', () => {
    expect(parseArgs(['add', 'buy milk'])).toEqual({
      file: undefined,
      rest: ['add', 'buy milk'],
    });
  });

  it('takes a leading path and removes both tokens', () => {
    expect(parseArgs(['--file', 'other.json', 'list'])).toEqual({
      file: 'other.json',
      rest: ['list'],
    });
  });

  it('throws when --file comes after the command, instead of using the default file', () => {
    expect(() => parseArgs(['list', '--file'])).toThrow('must come before');
    expect(() => parseArgs(['list', '--file', 'other.json'])).toThrow('must come before');
  });

  // The case that writes to a file nobody named: without the leading-only rule,
  // this parsed 'flag' as the data file and saved the todo 'document the in
  // README' there, then exited 0.
  it('throws rather than reading --file out of a todo title', () => {
    expect(() => parseArgs(['add', 'document the --file flag in README'])).not.toThrow();
    expect(() => parseArgs(['add', 'document', 'the', '--file', 'flag'])).toThrow(
      'must come before',
    );
  });

  it('throws when --file has no path', () => {
    expect(() => parseArgs(['--file'])).toThrow('needs a path');
  });

  it('throws on an empty path, which would otherwise mean the default file', () => {
    expect(() => parseArgs(['--file', '', 'list'])).toThrow('needs a path');
  });

  it('throws when the path after --file is another flag', () => {
    expect(() => parseArgs(['--file', '--file', 'other.json'])).toThrow('needs a path');
  });

  it('does not mutate the caller array', () => {
    const argv = ['--file', 'other.json', 'list'];

    parseArgs(argv);

    expect(argv).toEqual(['--file', 'other.json', 'list']);
  });

  // Deliberate, and documented in REVIEW.md's threat model: the path is passed
  // through untouched. There is no privilege boundary here, so a path this user
  // types is a path this user already has. If a reviewer flags this as path
  // traversal, the answer is the threat model, not a change here.
  it('passes a path through unchanged, including one that climbs out of the directory', () => {
    expect(parseArgs(['--file', '../../elsewhere/todos.json', 'list']).file).toBe(
      '../../elsewhere/todos.json',
    );
  });
});
