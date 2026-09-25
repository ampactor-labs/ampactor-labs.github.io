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

One sentence that says what it is and what it does. Up to three more
sentences on what is notable: the main technique, the main result, or who it
is for.

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

| Section        | Required             | What goes in it                                                                                                                                                      |
| -------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title and lead | yes                  | The name as `#`, then one paragraph of at most four sentences and 90 words. The first sentence stands alone as the project's one-line summary, under 160 characters. |
| Status line    | yes                  | `**Status: <label>.**` and one sentence of caveats. Labels are below.                                                                                                |
| Links line     | if any exist         | `Live:`, `Package:`, `Docs:` links, separated by `·`.                                                                                                                |
| Screenshot     | apps and games       | One image or GIF of the real thing, with alt text that says what it shows.                                                                                           |
| Quick start    | yes, or Usage        | The shortest path to seeing it work: install, run, what you should see. Commands must run as written.                                                                |
| Usage          | libraries and tools  | The dependency line, then the main API or commands with short examples. For a library this can stand in for Quick start.                                             |
| How it works   | recommended          | The main parts, how data moves between them, and the one or two decisions that shaped it and why. Link deeper write-ups in `docs/` instead of inlining them.         |
| Benchmarks     | performance claims   | Hardware, data, the command to reproduce, then a table. Include the cases it loses.                                                                                  |
| Data           | data-driven projects | Sources, licences, coverage, and how the data is refreshed.                                                                                                          |
| Project layout | optional             | A short tree of the directories a reader would open first.                                                                                                           |
| Deploy         | if deployed          | Where it runs and how a change gets there.                                                                                                                           |
| Testing        | yes                  | How to run the tests, what they cover, what CI runs, and what is not tested.                                                                                         |
| Limitations    | yes                  | What does not work yet, what it is bad at, and what it deliberately does not do. Its first paragraph is shown on the site, so it must stand on its own.              |
| Roadmap        | optional             | The next one to three things, each with the reason it is not done yet.                                                                                               |
| License        | yes                  | The licence, or "No license chosen yet."                                                                                                                             |

Anything else goes under **How it works** as a `###` subsection, or into a
file in `docs/` linked from there. Keep the README under about 200 lines.

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

```sh
npm run readmes:report
```

prints one line per repository: whether it meets the standard, then each
problem.

- **Errors**: a missing required section, a lead that is too long, a status
  label outside the list, an em dash, or a filler word.
- **Renames**: an old or miscapitalized section name, or a status label with
  more than one word.
- **Warnings**: sections out of order, extra sections, "not X, not Y"
  constructions, or a README over 200 lines.

A README meets the standard with no errors and no renames. Clearing the
renames shows it has been rewritten for this page, first sentence included,
so that is when its first sentence becomes the project's card on the home
page.

While repositories move to this layout, the old section names are accepted
with a warning: `Weak spots`, `What is honestly unfinished`, `Where it loses`,
`What this is not` and `Known limitations` for Limitations; `Verification`
and `Tests` for Testing; `Run`, `Try it`, `Play it`, `Setup`, `Install`,
`Dev`, `Development` and `Build` for Quick start; `Measured` for Benchmarks;
`Architecture` for How it works; `Layout` and `Files` for Project layout; and
`Where it's going` for Roadmap.
