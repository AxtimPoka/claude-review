import {
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import type { Todo } from './todo.js';

function dataFile(): string {
  // `||`, not `??`: an empty TODO_FILE means unset, not a file named ''.
  // `??` let '' through, and then `list` printed an empty list and exited 0 —
  // the user's real list, apparently gone. `save()` was not silent about it:
  // it threw on rename('.<pid>.tmp', '') and left nothing behind.
  return process.env.TODO_FILE || '.tiny-todo.json';
}

export function load(): Todo[] {
  const file = dataFile();
  if (!existsSync(file)) {
    return [];
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Todo[];
}

export function save(todos: Todo[]): void {
  const file = dataFile();
  // The temp file sits next to the target so the rename stays on one
  // filesystem, where it is atomic: a reader sees either the whole old file or
  // the whole new one, never a half-written list.
  const temp = `${file}.${process.pid}.tmp`;
  try {
    writeFileSync(temp, JSON.stringify(todos, null, 2) + '\n', 'utf8');
    renameSync(temp, file);
  } catch (error) {
    try {
      unlinkSync(temp);
    } catch {
      // Nothing was left to clean up.
    }
    throw error;
  }
}

/**
 * Writes rendered text to a path the user chose.
 *
 * Refuses one path: the data file. Writing rendered text over it would replace
 * the JSON with something load() cannot parse, in place and not atomically,
 * and every todo would be gone. That is this repo's first failure class, and
 * the invariant says the data file is replaced, never rewritten in place.
 *
 * Any other path is used as given — not resolved against a root, not confined
 * to a directory. See the threat model in REVIEW.md.
 *
 * Not atomic. A half-written export costs the user a re-run; only the data
 * file is worth the temp-file-and-rename dance.
 */
export function exportText(path: string, text: string): void {
  const target = dataFile();

  // Comparing resolved strings catches the obvious spelling and nothing else.
  // It misses a case variant on a case-insensitive filesystem — APFS, the
  // macOS default, and macOS is a supported platform — and it misses a symlink
  // or a hardlink to the data file. So ask the filesystem which file it is.
  // statSync follows symlinks, and a hardlink shares the inode, so one check
  // covers all three.
  if (resolve(path) === resolve(target)) {
    throw new Error('refusing to write the export over the data file');
  }
  if (existsSync(path) && existsSync(target)) {
    const candidate = statSync(path);
    const data = statSync(target);
    if (candidate.dev === data.dev && candidate.ino === data.ino) {
      throw new Error('refusing to write the export over the data file');
    }
  }

  writeFileSync(path, text, 'utf8');
}
