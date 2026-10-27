import { describe, expect, it } from 'vitest';
import { renderList } from '../src/render.js';

describe('renderList', () => {
  it('numbers todos from 1', () => {
    const output = renderList([
      { title: 'a', done: false },
      { title: 'b', done: true },
    ]);
    expect(output).toBe('1. [ ] a\n2. [x] b');
  });

  it('says so when there is nothing to do', () => {
    expect(renderList([])).toBe('Nothing to do.');
  });
});
