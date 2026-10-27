# tiny-todo

A todo CLI kept small enough that the review pipeline around it is the
interesting part, not the app.

## Stack

- TypeScript, ESM, Node 22. `module: NodeNext`, so relative imports end in `.js`.
- vitest for tests, eslint (flat config) for lint.
- `npm run check` = lint + typecheck + test. CI runs exactly this.

## Layout

| File | Owns |
| --- | --- |
| `src/todo.ts` | Pure list operations. No I/O. |
| `src/render.ts` | Turning todos into text. Display ids are 1-based. |
| `src/storage.ts` | The only file that touches disk. Sensitive. |
| `src/cli.ts` | Argument parsing and exit codes. |

## Conventions

- Functions in `todo.ts` take a list and return a new list. Never mutate.
- The library throws; `cli.ts` catches and turns errors into exit codes.
- Strict TypeScript, including `noUncheckedIndexedAccess`. No `any`.

## Non-goals

- No runtime dependencies. Dev dependencies only.
- No config file, no multiple lists, no due dates, no sync.
- Not aiming for pleasant UX. Aiming for a small, clear blast radius.
