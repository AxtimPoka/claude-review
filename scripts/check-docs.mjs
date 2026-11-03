// Markdown checks for this repo's own documents.
//
// Every rule exists because the mistake it catches actually happened, was
// caught by a human or by the AI review, and then happened again. Each cites
// the pull request it came from. Step 8 in PIPELINE.md is the argument for why
// a recorded lesson is worth less than a rule that runs.
//
// The emphasis and heading rules render the document instead of guessing. The
// first version of this file reimplemented CommonMark's flanking rules by hand
// and reported 28 problems in three documents that GitHub renders cleanly: it
// paired `**` line by line, so multi-line emphasis broke it, and it blanked
// backtick spans, which changed the characters next to a `**` and invented the
// failure it then reported. A checker that cries wolf is one nobody runs, so
// the guesswork is gone and `commonmark` does the parsing.
//
// One class is deliberately NOT checked: a `**` inside a fence or inside a
// code span. In a fence or a span those characters are verbatim by definition,
// so wanting bold there and quoting markdown source there look identical.
// Nothing can read the intent, and PIPELINE.md quotes markdown constantly.
// Checking it would mean rewriting correct prose to keep a tool quiet. That
// class stays human-caught, and PIPELINE.md's Step 8 says so.
//
// No network: `npm run check` must give the same answer on a laptop, in CI,
// and in a review job that cannot reach the internet.

import { readFileSync } from 'node:fs';
import { Parser, HtmlRenderer } from 'commonmark';

const parser = new Parser();
const renderer = new HtmlRenderer();
const render = (md) => renderer.render(parser.parse(md));

/** Mark which lines sit inside a fenced block, so fences are never split. */
function rows(text) {
  let fenced = false;
  return text.split('\n').map((line) => {
    const isFence = /^\s*(```|~~~)/.test(line);
    const inFence = fenced || isFence;
    if (isFence) fenced = !fenced;
    return { line, inFence };
  });
}

/** Blank-line separated chunks, keeping fenced blocks whole. */
function chunks(rs) {
  const out = [];
  let cur = null;
  rs.forEach(({ line, inFence }, i) => {
    if (line.trim() === '' && !inFence) {
      cur = null;
      return;
    }
    if (cur === null) {
      cur = { start: i + 1, lines: [] };
      out.push(cur);
    }
    cur.lines.push(line);
  });
  return out;
}

export function checkDocument(path, text) {
  const problems = [];
  const rs = rows(text);
  const report = (rule, line, message) => problems.push({ path, line, rule, message });

  // Rule 4 (#20, #26): does a `**` written in prose survive rendering? CJK text
  // fails this constantly, because `。` and `：` are punctuation and CommonMark
  // will not pair a run across them. Fenced blocks are skipped and code spans
  // become a placeholder word first -- see the note at the top for why. The
  // placeholder is a letter, not a blank, because blanking a span changes the
  // characters beside a `**` and that is how the first version invented
  // failures.
  for (const c of chunks(rs)) {
    if (c.lines.some((l) => /^\s*(```|~~~)/.test(l))) continue;
    const md = c.lines.join('\n').replace(/`[^`]*`/g, 'X');
    if (!md.includes('**')) continue;
    if (render(md).includes('**')) {
      report(4, c.start, 'a `**` here does not render as bold; it stays literal');
    }
  }

  // Rule 1 (#27): a `---` or `===` directly under a non-blank line is a setext
  // heading, not a rule. The paragraph above it silently becomes a heading.
  rs.forEach(({ line, inFence }, i) => {
    if (inFence || i === 0) return;
    if (!/^(-{3,}|={3,})\s*$/.test(line)) return;
    const prev = rs[i - 1];
    if (prev.line.trim() !== '' && !prev.inFence) {
      report(1, i + 1, 'a rule directly under text is a setext heading, not a rule');
    }
  });

  // Rule 1, from the other side: if the renderer produces more headings than
  // the source asks for, something became one. The text rule above locates the
  // usual cause; this catches a cause nobody has thought of yet.
  const asked = rs.filter((r) => !r.inFence && /^#{1,6} /.test(r.line)).length;
  const got = (render(text).match(/<h[1-6][ >]/g) ?? []).length;
  if (got !== asked) {
    report(1, 1, `source asks for ${asked} headings, the renderer produced ${got}`);
  }

  // Rule 5 (#26): two rules within two lines render as two separators.
  const hr = rs.map(({ line, inFence }, i) => (!inFence && /^-{3,}\s*$/.test(line) ? i : -1))
    .filter((i) => i >= 0);
  hr.forEach((i, k) => {
    if (k > 0 && i - hr[k - 1] <= 2) report(5, i + 1, 'two rules in a row');
  });

  // Rule 6 (#26): in a file that separates its `##` sections with a rule,
  // every later section must have one. Only checked where the file already
  // uses the convention: asserting it on a file that does not is a false
  // alarm, and that is the mistake this whole file was rewritten to avoid.
  if (hr.length > 0) {
    const heads = rs.map(({ line, inFence }, i) => (!inFence && line.startsWith('## ') ? i : -1))
      .filter((i) => i >= 0);
    heads.slice(1).forEach((i) => {
      const above = rs.slice(Math.max(0, i - 3), i).filter((r) => r.line.trim() !== '');
      if (above.length === 0 || above[above.length - 1].line.trim() !== '---') {
        report(6, i + 1, 'section heading with no rule before it');
      }
    });
  }

  return problems.sort((a, b) => a.line - b.line);
}

const files = process.argv.slice(2);
if (files.length > 0) {
  const all = files.flatMap((f) => checkDocument(f, readFileSync(f, 'utf8')));
  for (const p of all) console.error(`${p.path}:${p.line}  rule ${p.rule}: ${p.message}`);
  console.log(all.length === 0
    ? `checked ${files.length} document(s), no problems`
    : `${all.length} problem(s) in ${files.length} document(s)`);
  process.exit(all.length === 0 ? 0 : 1);
}
