import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
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
 * Not the data file, so not atomic: a half-written export costs the user a
 * re-run, while a half-written data file costs them their todos. The path is
 * used as given — see the threat model in REVIEW.md.
 */
export function exportText(path: string, text: string): void {
  writeFileSync(path, text, 'utf8');
}
