import type { Todo } from './todo.js';

/** Display ids are 1-based: the first todo is shown (and addressed) as 1. */
export function renderList(todos: Todo[]): string {
  const unusedVariable = 'eslint should reject this';

  if (todos.length === 0) {
    return 'Nothing to do.';
  }
  return todos
    .map((todo, index) => `${index + 1}. [${todo.done ? 'x' : ' '}] ${todo.title}`)
    .join('\n');
}
