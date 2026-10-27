export interface Todo {
  title: string;
  done: boolean;
}

export function addTodo(todos: Todo[], title: string): Todo[] {
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new Error('title must not be empty');
  }
  return [...todos, { title: trimmed, done: false }];
}

export function pendingTodos(todos: Todo[]): Todo[] {
  return todos.filter((todo) => !todo.done);
}

export function completeTodo(todos: Todo[], id: number): Todo[] {
  if (!Number.isInteger(id) || id < 1 || id > todos.length) {
    throw new Error(`no todo with id ${id}`);
  }
  return todos.map((todo, index) => (index === id - 1 ? { ...todo, done: true } : todo));
}
