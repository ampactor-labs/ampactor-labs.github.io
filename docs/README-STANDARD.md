# README standard

One format for the README of every project on ampactor.dev. The README is the
single source for what a project is: the site reads its summary, description
and limitations at build time, and `npm run readmes:report` checks every
repository against this page.

## Who reads it

1. **A hiring manager, for 30 seconds.** What is it, does it work, can I see
   it, what is it built with. Everything they need is above the first `##`.
2. **An engineer, for five minutes.** How to run it, how it works, how it is
   tested, where it falls short.
3. **The site's build.** It parses four fields (see
   [What the site reads](#what-the-site-reads)), so their shape is fixed.

## Layout

Sections appear in this order. Required ones are marked; leave out optional
sections that do not apply rather than filling them.

```markdown
# Name

A <kind of thing> that <does what>, in one sentence. Up to three more
sentences on what is notable (the main technique, the main result, who it is
for) and what it is built with.

**Status: shipping.** One sentence on what is missing or unstable, if anything.

Live: https://ampactor.dev/name/ · Package: https://crates.io/crates/name

![What the screenshot shows](docs/screenshot.png)

## Quick start

## Usage

## How it works

## Benchmarks

## Data

## Project layout

## Deploy

## Testing

## Limitations

## Roadmap

## License
```

| Section        | Required             | What goes in it                                                                                                                                                                                                                                                      |
| -------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title and lead | yes                  | The name as `#`, then one paragraph of at most four sentences and 90 words. The first sentence is the project's one-line summary, under 160 characters. It starts with what the project is ("A command-line tool that …"), because the site shows it under the name. |
| Status line    | yes                  | `**Status: <label>.**` and one sentence of caveats. Labels are below.                                                                                                                                                                                                |
| Links line     | if any exist         | `Live:`, `Package:`, `Docs:` links, separated by `·`.                                                                                                                                                                                                                |
| Screenshot     | apps and games       | One image or GIF of the real thing, with alt text that says what it shows.                                                                                                                                                                                           |
| Quick start    | yes, or Usage        | The shortest path to seeing it work: install, run, what you should see. Commands must run as written.                                                                                                                                                                |
| Usage          | libraries and tools  | The dependency line, then the main API or commands with short examples. For a library this can stand in for Quick start.                                                                                                                                             |
| How it works   | recommended          | The main parts, how data moves between them, and the one or two decisions that shaped it and why. Link deeper write-ups in `docs/` instead of inlining them.                                                                                                         |
| Benchmarks     | performance claims   | Hardware, data, the command to reproduce, then a table. Include the cases it loses.                                                                                                                                                                                  |
| Data           | data-driven projects | Sources, licences, coverage, and how the data is refreshed.                                                                                                                                                                                                          |
| Project layout | optional             | A short tree of the directories a reader would open first.                                                                                                                                                                                                           |
| Deploy         | if deployed          | Where it runs and how a change gets there.                                                                                                                                                                                                                           |
| Testing        | yes                  | How to run the tests, what they cover, what CI runs, and what is not tested.                                                                                                                                                                                         |
| Limitations    | yes                  | What does not work yet, what it is bad at, and what it deliberately does not do. It opens with a paragraph that stands on its own, because the site shows that paragraph alone. Lists and tables can follow it.                                                      |
| Roadmap        | optional             | The next one to three things, each with the reason it is not done yet.                                                                                                                                                                                               |
| License        | yes                  | The licence, or "No license chosen yet."                                                                                                                                                                                                                             |

Anything else becomes a `###` subsection of the section it belongs to
(reference material under Usage, design under How it works), or a file in
`docs/` linked from there. There is no Features, Stack or Status section:
what is notable and what it is built with go in the lead, and the state goes
in the status line. Keep the README under about 200 lines.

## Status labels

| Label       | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| `shipping`  | Deployed or published, and used for real.                        |
| `working`   | Runs end to end; the API, file format or data may still change.  |
| `prototype` | The core idea works; significant parts are missing.              |
| `paused`    | Not under active work. Say whether it still runs.                |
| `retired`   | No longer maintained. Say since when, and whether it still runs. |

The label is one word. Caveats go in the sentence after it.

## Writing rules

- **Say what it is.** Plain headings from the list above, in sentence case.
  No slogans, manifesto framing or cute section titles.
- **Make every claim checkable.** A number comes with how it was measured. A
  capability comes with a command, a test or a demo. Qualify what is only
  partly true ("most", "on desktop"), and never round a claim up.
- **No em dashes.** Use a period, a comma, a colon or parentheses.
- **No rhetorical patterns:** "X, not Y" contrasts, "not A, not B" runs, lists
  of three for rhythm, fragments for effect.
- **No filler or hype words:** honest, seamless, blazing, magic,
  revolutionary, game-changing, cutting-edge, unleash, supercharge, delve.
- **Short sentences, active voice, present tense.** First person is fine for
  decisions ("I chose SQLite because ...").
- **Explain domain terms once**, at first use, for a reader outside the field.
- **Show the losses.** Benchmarks include the cases where the project is
  slower; Limitations states what is weak without softening it.

## What the site reads

`scripts/sync-readmes.mjs` fetches each README at build time.

| Field          | Read from                          | Shown as                                                    | Used when                                             |
| -------------- | ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| `summary`      | First sentence of the lead         | The project's card on the home page                         | The README meets this standard: no errors, no renames |
| `desc`         | The lead paragraph                 | The project's page in the arcade cabinet                    | The lead passes the writing rules                     |
| `status`       | The **Status** line                | Not shown yet; the cabinet uses the status in `projects.js` | Checked by the report                                 |
| `operatorNote` | First paragraph of **Limitations** | The cabinet's known-limitations note                        | That paragraph passes the writing rules               |

When a field is not used, the site shows the hand-written text in
`src/data/projects.js` instead. A README that meets the standard therefore
takes over its project's card automatically on the next build.

## Checking a README

To check a draft, run this from the project's directory:

```sh
node path/to/ampactor-labs.github.io/scripts/check-readme.mjs README.md
```

It prints the sentence the site would show as the project's card, then each
problem, and exits with status 0 only when the README meets the standard.
From this repository, `npm run readmes:report` does the same for every
project's published README.

- **Errors**: a missing required section, a lead that is too long, a status
  label outside the list, a Limitations section that does not open with a
  paragraph, an em dash, or a filler word.
- **Renames**: an old or miscapitalized section name, or a status label with
  more than one word.
- **Warnings**: sections out of order, extra sections, a first sentence that
  starts with the project's name, "not X, not Y" constructions, or a README
  over 200 lines.

A README meets the standard with no errors and no renames. Clearing the
renames shows it has been rewritten for this page, first sentence included,
so that is when its first sentence becomes the project's card on the home
page.

While repositories move to this layout, the old section names still feed the
site, and the checker lists each one as a rename: `Weak spots`, `What is honestly unfinished`, `Where it loses`,
`What this is not` and `Known limitations` for Limitations; `Verification`
and `Tests` for Testing; `Run`, `Try it`, `Play it`, `Setup`, `Install`,
`Dev`, `Development` and `Build` for Quick start; `Measured` for Benchmarks;
`Architecture` for How it works; `Layout` and `Files` for Project layout; and
`Where it's going` for Roadmap.

## Moving a README to this standard

For a README that already exists, whether the rewrite is done by hand or by an
agent:

1. **Read the project first**: the current README, the code, the manifest
   (`package.json`, `Cargo.toml`, `pyproject.toml`), the CI workflows, the
   tests and `docs/`. Every sentence in the new README must be true of the
   code as it is now.
2. **Check the current README** to see what fails.
3. **Rewrite it.** Keep everything that is true, and rewrite moved text to the
   writing rules as it moves. Material that does not fit a section (design
   essays, long tables, history) goes into a file in `docs/`, linked from the
   section it came from. Cut only what is wrong, repeated or out of date.
4. **Verify it.**
   - Run every command in Quick start, Usage and Testing exactly as written.
     Where a command and the code disagree, fix the README.
   - Trace every number to a command you ran or a file in the repository, and
     say how it was measured. Drop a number you cannot trace.
   - Relative links and images must resolve, and external links must load.
   - Search the repository for anything that reads the README
     (`include_str!`, doctests, a docs site, tests, links to its headings) and
     keep it working.
5. **Check it until it meets the standard**, then read it once more against
   the writing rules. The checker cannot see slogans, lists of three,
   unexplained terms or unsupported claims.
6. **Commit it as a change of its own**, on a branch. Its description (the
   commit message, and the pull request if there is one) lists what moved
   where, what was cut and why, the status label and the evidence for it,
   anything that could not be verified (a command that needs hardware, a
   secret or a long build), and anything outside the README that should
   change, such as a stale manifest description or a missing LICENSE file.

The change touches `README.md`, adds files under `docs/` and fixes links to
moved text. It changes nothing else. For the details:

- **Licence**: name the one the repository has, from its LICENSE file or its
  manifest, or write "No license chosen yet." Choosing one is the owner's
  decision.
- **Status label**: choose it from evidence in the repository, such as a
  deploy, a published package or what the tests cover. Between two labels,
  choose the lower one.
- **Screenshot**: an image already in the repository, or a capture of the
  running project. No mockups.
- **Badges**: CI, package version, docs and licence, in one row under the
  title. Remove the rest.
- **Code blocks**: real output keeps its exact text, em dashes included.
