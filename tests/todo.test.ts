import { describe, expect, it } from 'vitest';
import { addTodo, completeTodo, pendingTodos } from '../src/todo.js';

describe('addTodo', () => {
  it('appends a todo that is not done yet', () => {
    expect(addTodo([], 'buy milk')).toEqual([{ title: 'buy milk', done: false }]);
  });

  it('trims the title', () => {
    expect(addTodo([], '  buy milk  ')[0]?.title).toBe('buy milk');
  });

  it('rejects an empty title', () => {
    expect(() => addTodo([], '   ')).toThrow(/empty/);
  });
});

describe('pendingTodos', () => {
  it('keeps only the unfinished ones', () => {
    const todos = [
      { title: 'a', done: true },
      { title: 'b', done: false },
    ];
    expect(pendingTodos(todos)).toEqual([{ title: 'b', done: false }]);
  });
});

describe('completeTodo', () => {
  it('marks the todo with the given display id, and only that one', () => {
    const todos = [
      { title: 'a', done: false },
      { title: 'b', done: false },
      { title: 'c', done: false },
    ];
    expect(completeTodo(todos, 1)).toEqual([
      { title: 'a', done: true },
      { title: 'b', done: false },
      { title: 'c', done: false },
    ]);
  });

  it('can complete the last todo', () => {
    expect(completeTodo([{ title: 'only', done: false }], 1)).toEqual([
      { title: 'only', done: true },
    ]);
  });

  it('rejects an id that does not exist', () => {
    expect(() => completeTodo([], 1)).toThrow(/no todo/);
  });
});
