# Kano Survey Tool

A self-contained, browser-based tool for running [Kano model](KANO_METHODOLOGY.md) feature-priority
surveys — build a survey, collect responses on a kiosk, and analyse which features delight customers,
which are merely expected, and which don't matter.

**Live tool:** https://billzhou-eh.github.io/kano/

It's a single HTML file with no backend and no framework. All data is stored locally in your browser
(IndexedDB); nothing is sent anywhere. To move data between machines or back it up, use the built-in
JSON/CSV export and import.

## Using it

Open the live link above. There's an **"ⓘ What is the Kano Model?"** button in the header for a 2-minute
intro. The tool has three modes:

- **Build** — create a survey and list the features to test (each gets an auto-generated functional /
  dysfunctional question pair, fully editable). Edit the 5-point answer scale here too.
- **Collect** — a kiosk flow for respondents: one feature at a time, both questions, with a progress
  indicator and a thank-you screen that resets for the next person.
- **Analyze** — per-feature Kano category (M / O / A / I / R / Q) with the M>O>A>I tie-break, the Better
  and Worse coefficients, and a hand-drawn Better/Worse diagram.

### Import / export

- **Whole project (JSON)** — *Export project* (Build mode) bundles the survey setup + every response into
  one `.json`; *Import* (sidebar) restores it as a new project. This is the back-up / move-machines path.
- **Responses (CSV)** — *Export responses* (Build/Analyze) and *Import responses* (Collect) move just the
  response rows, for Excel or merging data from multiple kiosks. Imported values are validated as engine
  positions 1–5; bad rows are rejected with a reason, never silently coerced.

## Privacy

Each browser keeps its own data. Colleagues opening the link get an empty tool — share a survey by
exporting the project JSON and having them import it. Clearing browser data for the site erases everything,
so export regularly if the data matters.

## Repository layout

| Path | What |
|------|------|
| `index.html` | The entire app (inline CSS/JS, IndexedDB). This is what GitHub Pages serves. |
| `src/kano.js` | The verified classification engine (lookup table + Better/Worse). Inlined verbatim into `index.html`. |
| `test/kano.test.js` | Unit tests for the engine (Node's built-in test runner: `node --test`). |
| `KANO_METHODOLOGY.md` | The methodology, with citations to the source papers and the exact evaluation table & formulas. |

The engine in `index.html` is kept byte-for-byte identical to `src/kano.js`.
