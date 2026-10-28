import {
  existsSync,
  linkSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportText, load, save } from '../src/storage.js';

const originalDataFile = process.env.TODO_FILE;
let directory: string;
let dataFile: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'tiny-todo-'));
  dataFile = join(directory, 'todos.json');
  process.env.TODO_FILE = dataFile;
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
  if (originalDataFile === undefined) {
    delete process.env.TODO_FILE;
  } else {
    process.env.TODO_FILE = originalDataFile;
  }
});

/**
 * These tests read the data file directly rather than trusting load(). save()
 * and load() agreeing with each other proves nothing when both can be wrong
 * about which file they are using.
 */
describe('storage', () => {
  it('writes the list to the configured file, and reads back exactly that', () => {
    const todos = [
      { title: 'buy milk', done: false },
      { title: 'write REVIEW.md', done: true },
    ];

    save(todos);

    expect(JSON.parse(readFileSync(dataFile, 'utf8'))).toEqual(todos);
    expect(load()).toEqual(todos);
  });

  it('returns an empty list when the file does not exist', () => {
    expect(load()).toEqual([]);
  });

  it('writes an empty list as an empty file, not as a missing one', () => {
    save([{ title: 'buy milk', done: false }]);

    save([]);

    expect(existsSync(dataFile)).toBe(true);
    expect(JSON.parse(readFileSync(dataFile, 'utf8'))).toEqual([]);
    expect(load()).toEqual([]);
  });

  it('refuses to guess when the file is corrupt, instead of returning an empty list', () => {
    writeFileSync(dataFile, '{ this is not json', 'utf8');

    expect(() => load()).toThrow();
  });

  it('treats an empty TODO_FILE as unset, not as a file named emptystring', () => {
    const cwd = process.cwd();
    process.chdir(directory);
    try {
      process.env.TODO_FILE = '';

      save([{ title: 'buy milk', done: false }]);

      expect(readdirSync(directory)).toEqual(['.tiny-todo.json']);
      expect(load()).toEqual([{ title: 'buy milk', done: false }]);
    } finally {
      process.chdir(cwd);
    }
  });

  it('writes exported text to the path it was given', () => {
    const target = join(directory, 'report.txt');

    exportText(target, '1. [ ] buy milk\n');

    expect(readFileSync(target, 'utf8')).toBe('1. [ ] buy milk\n');
  });

  it('refuses to write the export over the data file', () => {
    save([{ title: 'buy milk', done: false }]);

    expect(() => exportText(dataFile, 'rendered text\n')).toThrow('over the data file');
    expect(() => exportText(join(directory, 'sub', '..', 'todos.json'), 'x\n')).toThrow(
      'over the data file',
    );
    expect(load()).toEqual([{ title: 'buy milk', done: false }]);
  });

  it('refuses a symlink that points at the data file', () => {
    save([{ title: 'buy milk', done: false }]);
    const link = join(directory, 'link.json');
    symlinkSync(dataFile, link);

    expect(() => exportText(link, 'rendered text\n')).toThrow('over the data file');
    expect(load()).toEqual([{ title: 'buy milk', done: false }]);
  });

  it('refuses a hardlink to the data file', () => {
    save([{ title: 'buy milk', done: false }]);
    const link = join(directory, 'hard.json');
    linkSync(dataFile, link);

    expect(() => exportText(link, 'rendered text\n')).toThrow('over the data file');
    expect(load()).toEqual([{ title: 'buy milk', done: false }]);
  });

  // This does NOT prove the write was atomic: a save() that writes the target
  // directly passes it too, because it never creates a temp file at all. It
  // only catches an atomic save() that forgets to clean up. Atomicity itself
  // is guarded by REVIEW.md, not by CI.
  it('leaves no temporary file behind after a successful save', () => {
    save([{ title: 'buy milk', done: false }]);

    expect(readdirSync(directory)).toEqual(['todos.json']);
  });
});
