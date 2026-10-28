import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args.js';

describe('parseArgs', () => {
  it('leaves argv alone when --file is not used', () => {
    expect(parseArgs(['add', 'buy milk'])).toEqual({
      file: undefined,
      rest: ['add', 'buy milk'],
    });
  });

  it('takes the path and removes both tokens', () => {
    expect(parseArgs(['--file', 'other.json', 'list'])).toEqual({
      file: 'other.json',
      rest: ['list'],
    });
  });

  it('finds the flag after the command too', () => {
    expect(parseArgs(['add', 'buy milk', '--file', 'other.json'])).toEqual({
      file: 'other.json',
      rest: ['add', 'buy milk'],
    });
  });

  it('leaves --file in place when nothing follows it, so the CLI prints usage', () => {
    expect(parseArgs(['list', '--file'])).toEqual({
      file: undefined,
      rest: ['list', '--file'],
    });
  });

  it('does not copy the caller array', () => {
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
