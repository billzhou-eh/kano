'use strict';

/**
 * Kano model classification engine.
 *
 * Self-contained, no framework, no UI. Implements the methodology documented in
 * ../KANO_METHODOLOGY.md, which was extracted from the project PDFs:
 *   - Sauerwein et al. (1996)  [kano-model2.pdf]            — scale, table, rules, CS formulas
 *   - Xu et al. (2009)         [An_analytical...pdf]        — table
 *   - Witell et al. (2013)     [FULLTEXT02.pdf]             — table
 *   - Muchtiar et al. (2018)   [Quality_Improvement...pdf]  — table (deviating Worse formula, rejected)
 *   - Brand & Rese (2026)      [S0969...pdf]                — CS+/CS- formulas, worked examples
 *
 * The six categories: M (Must-be), O (One-dimensional), A (Attractive),
 * I (Indifferent), R (Reverse), Q (Questionable).
 */

/** The six Kano categories. */
const CATEGORIES = Object.freeze(['M', 'O', 'A', 'I', 'R', 'Q']);

/**
 * The five answer positions on the functional/dysfunctional scale (1-indexed).
 * Position is what the engine classifies on; wording is label-agnostic.
 */
const SCALE = Object.freeze([
  { position: 1, key: 'like', label: 'I like it that way' },
  { position: 2, key: 'must-be', label: 'It must be that way' },
  { position: 3, key: 'neutral', label: 'I am neutral' },
  { position: 4, key: 'live-with', label: 'I can live with it that way' },
  { position: 5, key: 'dislike', label: 'I dislike it that way' },
]);

/**
 * Maps the various label wordings found across the source PDFs to a scale
 * position (1-5). Lets callers feed any documented variant. Keys are lowercased.
 */
const LABEL_TO_POSITION = Object.freeze((() => {
  const m = {
    // Kano (1984) / Sauerwein / Xu — canonical
    'i like it that way': 1, 'it must be that way': 2, 'i am neutral': 3,
    'i can live with it that way': 4, 'i dislike it that way': 5,
    // Berger et al. (1993) "American"
    'i enjoy it that way': 1, 'i expect it that way': 2, 'i can accept it': 4,
    // Witell (2013) Fig. 1
    'i am expecting it to be that way': 2, 'i can accept it to be that way': 4,
    // Chapman & Callegaro (2022)
    'i like it': 1, 'i expect it': 2, 'i feel neutral': 3, 'i can tolerate it': 4, 'i dislike it': 5,
    // short forms / Muchtiar (2018) headers
    'like': 1, 'must-be': 2, 'must be': 2, 'expect': 2, 'neutral': 3,
    'live-with': 4, 'live with': 4, 'accept': 4, 'tolerate': 4, 'may': 4, 'dislike': 5,
  };
  return m;
})());

/**
 * The literal Kano evaluation table (KANO_METHODOLOGY.md §2).
 * Rows = functional answer position (1-5); columns = dysfunctional answer position (1-5).
 * Identical across Sauerwein Fig.6, Xu Table 2, Witell Fig.1, Muchtiar Table 1.
 *
 * Indexed [functional-1][dysfunctional-1].
 *
 *               dys: 1 like  2 must  3 neut  4 live  5 dislike
 *   fun 1 like        Q        A       A       A        O
 *   fun 2 must-be     R        I       I       I        M
 *   fun 3 neutral     R        I       I       I        M
 *   fun 4 live-with   R        I       I       I        M
 *   fun 5 dislike     R        R       R       R        Q
 */
const EVALUATION_TABLE = Object.freeze([
  Object.freeze(['Q', 'A', 'A', 'A', 'O']),
  Object.freeze(['R', 'I', 'I', 'I', 'M']),
  Object.freeze(['R', 'I', 'I', 'I', 'M']),
  Object.freeze(['R', 'I', 'I', 'I', 'M']),
  Object.freeze(['R', 'R', 'R', 'R', 'Q']),
]);

/**
 * Tie-break priority for the dominant category (KANO_METHODOLOGY.md §3).
 * Source rule is "M > O > A > I" (Sauerwein p.9 / Berger et al. 1993); R and Q
 * are appended last as non-substantive. Lower index = higher priority.
 */
const DOMINANCE_ORDER = Object.freeze(['M', 'O', 'A', 'I', 'R', 'Q']);

/**
 * Normalize a single answer to a scale position 1-5.
 * Accepts a number (1-5) or any documented label string (case-insensitive).
 * @param {number|string} answer
 * @returns {number} position in 1..5
 */
function toPosition(answer) {
  if (typeof answer === 'number') {
    if (Number.isInteger(answer) && answer >= 1 && answer <= 5) return answer;
    throw new RangeError(`Answer must be an integer 1-5, got: ${answer}`);
  }
  if (typeof answer === 'string') {
    const pos = LABEL_TO_POSITION[answer.trim().toLowerCase()];
    if (pos) return pos;
    throw new RangeError(`Unrecognized answer label: "${answer}"`);
  }
  throw new TypeError(`Answer must be a number 1-5 or a label string, got: ${typeof answer}`);
}

/**
 * Classify one respondent's (functional, dysfunctional) answer pair into a Kano
 * category via the literal lookup table. No heuristics.
 * @param {number|string} functionalAnswer   1-5 or a label
 * @param {number|string} dysfunctionalAnswer 1-5 or a label
 * @returns {'M'|'O'|'A'|'I'|'R'|'Q'}
 */
function classify(functionalAnswer, dysfunctionalAnswer) {
  const f = toPosition(functionalAnswer);
  const d = toPosition(dysfunctionalAnswer);
  return EVALUATION_TABLE[f - 1][d - 1];
}

/**
 * Compute the dominant category from counts using the mode with the
 * M > O > A > I > R > Q tie-break (KANO_METHODOLOGY.md §3).
 * @param {Record<string, number>} counts
 * @returns {'M'|'O'|'A'|'I'|'R'|'Q'|null} null if every count is 0
 */
function dominantCategory(counts) {
  let best = null;
  let bestCount = -1;
  for (const cat of DOMINANCE_ORDER) {
    const c = counts[cat] || 0;
    if (c > bestCount) {
      bestCount = c;
      best = cat;
    }
    // equal counts: DOMINANCE_ORDER iteration order already enforces the
    // M>O>A>I>R>Q tie-break, since we only replace on strictly-greater.
  }
  return bestCount > 0 ? best : null;
}

/**
 * Better / Worse (CS) coefficients (KANO_METHODOLOGY.md §4).
 *   Better = (A + O) / (A + O + M + I)
 *   Worse  = -(O + M) / (A + O + M + I)
 * Denominator excludes R and Q. Returns 0 for both when the denominator is 0.
 * @param {Record<string, number>} counts
 * @returns {{better: number, worse: number, denominator: number}}
 */
function csCoefficients(counts) {
  const A = counts.A || 0;
  const O = counts.O || 0;
  const M = counts.M || 0;
  const I = counts.I || 0;
  const denom = A + O + M + I;
  if (denom === 0) return { better: 0, worse: 0, denominator: 0 };
  return {
    better: (A + O) / denom,
    worse: -(O + M) / denom,
    denominator: denom,
  };
}

/**
 * Aggregate all respondents' answers for ONE feature.
 *
 * @param {Array<{functional:(number|string), dysfunctional:(number|string)} | [any, any]>} responses
 *        Each item is either {functional, dysfunctional} or a [functional, dysfunctional] pair.
 * @returns {{
 *   counts: Record<string, number>,
 *   total: number,
 *   dominant: ('M'|'O'|'A'|'I'|'R'|'Q'|null),
 *   better: number,
 *   worse: number
 * }}
 */
function aggregate(responses) {
  if (!Array.isArray(responses)) {
    throw new TypeError('aggregate expects an array of responses');
  }
  const counts = { M: 0, O: 0, A: 0, I: 0, R: 0, Q: 0 };
  for (const r of responses) {
    let f;
    let d;
    if (Array.isArray(r)) {
      [f, d] = r;
    } else if (r && typeof r === 'object') {
      f = r.functional;
      d = r.dysfunctional;
    } else {
      throw new TypeError('Each response must be {functional, dysfunctional} or [functional, dysfunctional]');
    }
    counts[classify(f, d)] += 1;
  }
  const { better, worse } = csCoefficients(counts);
  return {
    counts,
    total: responses.length,
    dominant: dominantCategory(counts),
    better,
    worse,
  };
}

module.exports = {
  CATEGORIES,
  SCALE,
  LABEL_TO_POSITION,
  EVALUATION_TABLE,
  DOMINANCE_ORDER,
  toPosition,
  classify,
  dominantCategory,
  csCoefficients,
  aggregate,
};
