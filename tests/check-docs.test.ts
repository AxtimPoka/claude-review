import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM tooling script, no type declarations
import { checkDocument } from '../scripts/check-docs.mjs';

type Problem = { path: string; line: number; rule: string; message: string };

/** Every problem, as the pair that identifies it: which rule, and where. */
const found = (md: string): { rule: string; line: number }[] =>
  (checkDocument('fixture.md', md) as Problem[]).map((p) => ({ rule: p.rule, line: p.line }));

// Each case below is a mistake that reached a pull request in this repo. The
// rule is only worth having if it still refuses the thing it was written for,
// so every one of them is a test, not a comment. Step 8 in PIPELINE.md is the
// argument.
//
// Every assertion is the COMPLETE list of problems, not `toContain`. The first
// version used `toContain(1)`, and two different checks shared the number 1 at
// the time, so the setext case passed on either of them: the half that names
// the line could have been deleted with the test still green. That is
// REVIEW.md's "a test that counts instead of identifying" class, in the suite
// written to stop exactly that. Caught in review on #28.
describe('mistakes this repo actually made', () => {
  it('PR #20: a closing ** after a full stop does not render', () => {
    // `。` is punctuation, so CommonMark will not let the run close.
    expect(found('**檔案寫好了，帳號也有了。**還有一半沒驗證。')).toEqual([
      { rule: 'literal-bold', line: 1 },
    ]);
  });

  it('PR #26: an opening ** before a quote mark does not render', () => {
    expect(found('已經有一列缺口是**「沒有東西在比對」**。')).toEqual([
      { rule: 'literal-bold', line: 1 },
    ]);
  });

  it('PR #27: a rule directly under text is a heading, not a rule', () => {
    // Both halves fire, and they are named apart so this can say so: the line
    // rule points at the `---`, the count rule notices the extra heading.
    expect(found('那是已知的做法，還沒做。\n---\n\n## 下一節\n')).toEqual([
      { rule: 'heading-count', line: 1 },
      { rule: 'setext-rule', line: 2 },
    ]);
  });

  it('PR #26: two rules in a row render as two separators', () => {
    expect(found('一段話。\n\n---\n\n---\n\n## 下一節\n')).toEqual([
      { rule: 'double-rule', line: 5 },
    ]);
  });

  it('PR #26: a section with no rule before it, in a file that uses them', () => {
    const md = '## 一\n\n內容。\n\n---\n\n## 二\n\n內容。\n\n## 三\n\n內容。\n';
    expect(found(md)).toEqual([{ rule: 'missing-rule', line: 11 }]);
  });
});

// The first version of this checker reported 28 problems in three documents
// that GitHub renders cleanly. These cases are why, so that a later rewrite
// cannot quietly bring the guesswork back.
describe('what the first version of the checker got wrong', () => {
  it('bold that spans two lines of one paragraph is fine', () => {
    expect(found('所以每一次推新版本都會讓**數字\n過期**。要寫一個不會過期的數字就要釘住它。')).toEqual([]);
  });

  it('bold wrapped around a code span is fine', () => {
    expect(found('**`CLAUDE.md`** 寫給寫程式的人和 AI 看。')).toEqual([]);
  });

  it('a file that never uses rules is not asked to have them', () => {
    expect(found('## 一\n\n內容。\n\n## 二\n\n內容。\n')).toEqual([]);
  });
});

// Two mistakes from #26 and #27 were bold inside a code span and bold inside a
// fenced block. Both are deliberately NOT checked, and these cases pin that
// decision down so a later change cannot reintroduce the false alarms.
//
// In a fence or a span those characters are verbatim by definition, so wanting
// bold there and quoting markdown source there look the same. PIPELINE.md
// quotes markdown constantly -- the Step 8 section alone contains both shapes
// on purpose -- and checking this class would mean rewriting correct prose to
// keep a tool quiet. It stays human-caught.
describe('verbatim contexts, where intent cannot be read', () => {
  it('bold inside a code span is left alone', () => {
    expect(found('結果是 `mergeState=**BEHIND**`，不是 CLEAN。')).toEqual([]);
  });

  it('bold inside a fenced block is left alone', () => {
    expect(found('```\n? 回滾會不會更乾淨——**量不到**\n```')).toEqual([]);
  });

  it('but bold wrapped around a code span still has to render', () => {
    expect(found('**`CLAUDE.md`：**接著的字')).toEqual([
      { rule: 'literal-bold', line: 1 },
    ]);
  });
});
