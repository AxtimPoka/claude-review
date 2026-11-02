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
| `src/storage.ts` | The only file that touches disk. Sensitive: it and its test are the high risk tier, so a change to either needs a code owner's approval. |
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
- CODEOWNERS is the high risk tier, nothing more and nothing less. It covers
  the files that decide what CI actually runs — `.github/workflows/`,
  `.github/CODEOWNERS`, `package.json`, the lockfile, `eslint.config.js` and
  `tsconfig.json` — plus `src/storage.ts` and its test, the highest-risk code
  in the repo. Not all of `.github/`: `pull_request_template.md` is medium,
  like the other files that steer a review. The medium tier asks for one person, and the
  person who prompted a change counts as that one, so it needs no approval
  here; the high tier asks for two, which is the author plus one, which is
  exactly one approval. That is why there is no second file listing tiers:
  "high" and "listed in CODEOWNERS" are the same thing, so nothing can drift.
  It deliberately does not cover `REVIEW.md` or `CLAUDE.md`, although they are
  the reviewer's instructions and the same argument applies to them. The reason
  is not cost: `CLAUDE.md` changed 6 times and `REVIEW.md` 4 in 15 commits, but
  only one of those commits touched neither file next to a path that is already
  owned, so owning both would add about 1 pull request in 15. The reason is
  that neither governs the run that judges it any more. The AI
  review action replaces a pull request's `CLAUDE.md` with main's before it
  runs, so a pull request cannot change *that* file's conventions. `REVIEW.md`
  has no such protection of its own, and the conventions that actually decide
  findings live there: the bug classes, the invariants no test guards, and the
  `Skip` list. So both workflows now swap it by hand, in a step before the
  action runs: the working tree's `REVIEW.md` is replaced with main's. A pull request's copy is a
  proposal, still visible in the diff, and it does not govern the run that
  judges it. The AI review's action checks the pull request's branch out again
  after that step, so its `actions/checkout` is pinned to the head sha rather
  than the merge ref — otherwise git restores the branch's copy whenever main
  has changed the file since. Both jobs end with a step that compares the file
  to main's and fails if it differs, because the swap holding is an assumption
  about someone else's action.
