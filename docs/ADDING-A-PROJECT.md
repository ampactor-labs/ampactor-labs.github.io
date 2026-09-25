# Adding a project to the site

Two commands and one paste.

```sh
npm run add:project -- <repo>          # print an entry, with content pulled from the README
npm run add:project -- <repo> --write  # or append it to src/data/projects.js for you
```

Then fill in the `TODO` fields. Those are presentation and only you can pick
them: `subtitle`, `tagline`, `icon`, `tags`, `stack`, `category`, and
`highlights` (short claims with numbers, written for a card).

Everything else takes care of itself. `desc`, `operatorNote` and, once the
README meets the standard, the card line (`outcome`) come from the repo's
README at build time, so once the entry exists you edit the README and the
card follows.

## What the README needs

The format is [README-STANDARD.md](README-STANDARD.md). The site reads three
things from it:

1. The lead paragraph under the H1: what it is and what it does. Its first
   sentence becomes the project's card once the README meets the standard.
2. The `**Status: <label>.**` line, with a label from `shipping`, `working`,
   `prototype`, `paused` or `retired`, then one sentence of caveats.
3. The `## Limitations` section, stating at least one real limitation. The
   older names (`Weak spots`, `What is honestly unfinished`, `Where it
loses`, `What this is not`, `Known limitations`) still count while
   repositories move over.

A field that does not pass the standard's writing rules keeps the prose in
`projects.js`, and nothing breaks. Check where every repository stands:

```sh
npm run readmes:report
```

## Auditing the README itself

```sh
python3 ~/.claude/skills/prose/scripts/readme-audit ~/Projects/<repo>
```

That verifies claims rather than sentences: cited files and line numbers
exist, named CI jobs are real, published test counts still match the tree,
required sections are present, and no forbidden vocabulary survived. Hard
findings exit 1. For sentences, `sloplint` is the other half.

## Why the split

Content lives in the repo; presentation lives here. Every stale thing this
site has ever shipped was content — turbosort's card describing a version it
had outgrown, landed missing for a day, sonido advertising 35 effects against
a repo with 36. No color or icon has ever gone wrong.

Highlights stay hand-written on purpose. Three attempts at deriving them from
README text produced junk like `1.86X TS VS VORACIOUS` and `i32 Signed
integers XOR the sign bit`, because a card phrase and a paragraph are
different artifacts.
