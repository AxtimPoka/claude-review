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
| `src/args.ts` | Parsing and validating arguments. Pure, no I/O. |
| `src/cli.ts` | Dispatch and exit codes. |

## Conventions

- Functions in `todo.ts` take a list and return a new list. Never mutate.
- The library throws; `cli.ts` catches and turns errors into exit codes.
- Strict TypeScript, including `noUncheckedIndexedAccess`. No `any`.

## Non-goals

- No runtime dependencies. Dev dependencies only.
- No config file, no multiple lists, no due dates, no sync.
- Not aiming for pleasant UX. Aiming for a small, clear blast radius.
- Linux and macOS only. CI runs on Linux. Windows is out of scope: `save()`
  renames over an existing file, which behaves differently there. Nobody runs
  this repo on Windows, so the check would cost something and protect nothing.
  Do not add a Windows job to CI. This is decided; it does not need revisiting.
- CODEOWNERS covers `.github/`, `package.json`, the lockfile and the tool
  configs — the files that decide what CI actually runs. It deliberately does
  not cover `REVIEW.md` or `CLAUDE.md`, although they are the reviewer's
  instructions and the same argument applies to them. They changed 4 times in
  this repo's first 12 commits; owning them would make a third of all pull
  requests wait on a second person. The two are not equally exposed, and the
  difference is the reason this is a non-goal rather than a hole: the AI review
  action replaces a pull request's `CLAUDE.md` with main's before it runs, so a
  pull request cannot change *that* file's conventions. `REVIEW.md` has no such
  protection of its own, and the conventions that actually decide findings live
  there: the bug classes, the invariants no test guards, and the `Skip` list. So
  both workflows now swap it by hand, in a step before the action runs: the
  working tree's `REVIEW.md` is replaced with main's. A pull request's copy is a
  proposal, still visible in the diff, and it does not govern the run that
  judges it. The AI review's action checks the pull request's branch out again
  after that step, so its `actions/checkout` is pinned to the head sha rather
  than the merge ref — otherwise git restores the branch's copy whenever main
  has changed the file since. Both jobs end with a step that compares the file
  to main's and fails if it differs, because the swap holding is an assumption
  about someone else's action.
