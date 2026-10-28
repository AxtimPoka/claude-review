# Review guide — tiny-todo

Written by the code owners. If a review keeps raising something that is not in
here, the fix belongs in this file, not in another round of comments.

## Threat model

This is a single-user command line tool. It has no network access, no runtime
dependencies, and no privilege boundary: whoever runs it can already read and
write every file their own account can. A finding has to name the boundary it
crosses, and in this repo that boundary has to come from the phase below.

**Phase 1 — the current phase. Assume there is no attacker.** A finding counts
only if it harms the person running the command, by accident. These do not
count:

- A path the user supplies being used as a path. `--file ../../x` gives that
  user nothing a text editor would not. There is no boundary for a traversal
  to cross.
- The data file being readable. It holds that user's own todos, on their own
  machine, under their own account.
- A crash on malformed input. That is robustness, not security. Raise it in
  the normal review if it loses data — see *What failure looks like here*,
  below.

**Phase 2 — not in force yet. Other users on the same machine.** When this
line says phase 2 is in force, the account becomes the boundary and these
become real:

- A guessable temporary file path in a directory other users can write.
  `save()` writes to `<file>.<pid>.tmp`, and a pid is a small number.
- The permissions the data file is created with.

Until this section says phase 2 is in force, a phase 2 finding is out of
scope. Close it with a pointer to this section and name the phase it belongs
to. Do not weaken the finding — it is correct, and it is not yet ours.

## What failure looks like here

This CLI owns a file of the user's data. The failures that matter, worst first:

1. **Data loss or corruption.** A todo disappears, is overwritten, or the data
   file is left half-written. `src/storage.ts` is the only place that can do this.
2. **The wrong todo is affected.** A command reports success but acts on a
   different item than the user named.
3. **Silent failure.** A command does nothing useful and still exits 0.

A cosmetic change to the output is not a failure. Neither is a case that can
only be reached by hand-editing the data file.

## How to report

- Every finding needs a file and a line. No evidence, no finding.
- Tag each one `Important`, `Nit`, or `Pre-existing`.
- **At most 3 `Nit`s per review.** More than that means you are reviewing style
  instead of behaviour.
- `Pre-existing` is for problems this diff did not introduce. Say so plainly so
  the author is not blamed for them.

## How a finding gets closed

A review comment is a thread, and an unresolved thread blocks the merge. So a
finding has exactly two ends:

1. **Fixed.** The commit that fixes it closes the thread.
2. **Declined, with the reason written down here.** If the answer is that this
   repo deliberately does not handle the case, that belongs in this file, or in
   `Non-goals` in CLAUDE.md. Then close the thread with a pointer to it.

A reply that disputes a finding is itself a finding, and it carries the same
burden of evidence: quote the line you are disputing. This repo has already
lost a round to a "correction" that described a mistake the finding had not
made, which the next review then accepted because it read the correction and
not the original.

"Won't fix" on its own is not an end. A reason that lives only inside a closed
thread is a reason the next review cannot find, so the same finding comes back
on the next pull request, and someone argues it again.

## Worth checking in this repo

- Does the change do what the PR says it does?
- On a bug fix: is the root cause fixed, or only the symptom?
- Does a new command handle the empty list, and an argument that is out of range?
- Does anything new write to disk? What is left behind if it throws halfway?

## Bug classes this repo has already been bitten by

Flag the class, not just the line. If you see one of these, say which class it is.

- **1-based id meets 0-based index.** Ids shown to the user start at 1; array
  indexes start at 0. The conversion must happen exactly once. Check the
  boundary explicitly: the last item is where a missing `- 1` stops throwing
  and starts failing silently.
- **A test that counts instead of identifying.** `expect(result.filter(done)).toHaveLength(1)`
  passes whichever item was changed. If a function picks one item out of many,
  the test must assert *which* one — normally by asserting the whole returned
  list.
- **Success reported for work not done.** A command that saves, prints a
  success line and returns 0 without changing anything. Green tests and a
  green CI will not catch this; only reading the diff against the rest of the
  repo will.
- **A test that is self-consistent but proves nothing.** `save()` followed by
  `load()` returning the same list passes even when both are using the wrong
  file. A test needs a judge from outside the code under test — read the file,
  do not ask the function to confirm itself.

## Invariants no test guards — these are yours

Nothing in CI checks the items below. A review is the only thing standing
between them and main. Check each one on any diff touching the named file, and
say in your finding which invariant was broken.

### `src/storage.ts` must replace the data file, never rewrite it in place

`save()` writes to a temporary file and then `renameSync`s it over the target.
The temp file must sit in the same directory as the target, for two separate
reasons:

- **Across filesystems the rename does not happen at all.** `rename(2)` returns
  `EXDEV` and Node does not fall back to a copy, so every save fails and an
  existing data file is left byte for byte as it was. Measured against a
  pre-existing data file on a second filesystem: `rename FAILED: EXDEV`, and
  the file's contents were unchanged afterwards. So this one is loud and loses
  nothing. **A half-written data file would be worse** — it is failure #1 above
  — and it is the thing a cross-filesystem rename cannot produce. Do not go
  looking for it here.
- **Outside that directory the temp name is not private.** A guessable name in
  a directory other accounts can write lets another local user pre-place that
  path. See the threat model above for when that counts.

Reject a diff that:

- calls `writeFileSync`, `appendFileSync` or `createWriteStream` on the data
  file path directly;
- renames into place from somewhere else, such as the system temp directory;
- renames before the write has returned.

**Why there is no test.** Proving atomicity means killing the process
mid-write. A cheaper proxy was tried — asserting no temp file is left behind —
and measured against a non-atomic `save()`, which passed it. A test that buys
false confidence is worse than no test, because the layers downstream then
assume someone is watching. So this check lives here instead.

**What it costs if it slips.** The data file is left half-written and every
todo is lost. Nothing downstream recovers it: there is no backup, and
reverting the code does not restore a file.

## Skip

- `package-lock.json`
- `dist/`
- Formatting and import order. eslint owns those.
