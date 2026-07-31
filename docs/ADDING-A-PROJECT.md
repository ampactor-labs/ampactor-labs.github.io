# Adding a project to the site

Two commands and one paste.

```sh
npm run add:project -- <repo>          # print an entry, with content pulled from the README
npm run add:project -- <repo> --write  # or append it to src/data/projects.js for you
```

Then fill in the `TODO` fields. Those are presentation and only you can pick
them: `subtitle`, `tagline`, `icon`, `tags`, `stack`, `category`, and
`highlights` (short claims with numbers, written for a card).

Everything else takes care of itself. `desc`, `operatorNote`, and the status
come from the repo's README at build time, so once the entry exists you never
edit prose here again; you edit the README and the card follows.

## What makes a README sync

Three things, all from the house spec (`~/.claude/skills/prose/readme-architecture.md`):

1. A lead paragraph under the H1 saying what it is and who it is for, before
   any badge.
2. A `**Status:** ...` line, from the vocabulary `Shipping`, `Working, API
   unstable`, `Prototype`, or `Retired <date>`, followed by a clause naming
   what is not done.
3. A `## Weak spots` section stating at least one real limitation. The
   headings `What is honestly unfinished`, `Where it loses`, `What this is
   not`, and `Known limitations` count too.

A README missing any of those keeps whatever prose is already in
`projects.js`, and nothing breaks. Check where things stand:

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
