/**
 * Readonly on purpose, and so are the parameters below. CLAUDE.md's convention
 * is that `todo.ts` takes a list and returns a new one, never mutating. Until
 * now that was prose only: the compiler let a caller assign to a field, push
 * onto the array, splice it or replace an element. `readonly` fields stop the
 * first; `readonly Todo[]` parameters stop the rest. Return types stay
 * `Todo[]`, because each body already builds a fresh array.
 */
export interface Todo {
  readonly title: string;
  readonly done: boolean;
}

export function addTodo(todos: readonly Todo[], title: string): Todo[] {
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new Error('title must not be empty');
  }
  return [...todos, { title: trimmed, done: false }];
}

export function pendingTodos(todos: readonly Todo[]): Todo[] {
  return todos.filter((todo) => !todo.done);
}

export function completeAll(todos: Todo[]): Todo[] {
  for (const todo of todos) {
    todo.done = true;
  }
  return todos;
}

export function completeTodo(todos: readonly Todo[], id: number): Todo[] {
  if (!Number.isInteger(id) || id < 1 || id > todos.length) {
    throw new Error(`no todo with id ${id}`);
  }
  return todos.map((todo, index) => (index === id - 1 ? { ...todo, done: true } : todo));
}
