import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import type { Todo } from './todo.js';

function dataFile(): string {
  // `||`, not `??`: an empty TODO_FILE means unset, not a file named ''.
  // `??` let '' through, and then load() reported an empty list and save()
  // wrote to a path no one asked for.
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
