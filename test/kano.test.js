'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  classify,
  aggregate,
  csCoefficients,
  dominantCategory,
  toPosition,
  EVALUATION_TABLE,
} = require('../src/kano');

/**
 * The expected evaluation table, re-typed INDEPENDENTLY from the source PDFs
 * (KANO_METHODOLOGY.md §2 — identical in Sauerwein Fig.6, Xu Table 2,
 * Witell Fig.1, Muchtiar Table 1). Rows = functional 1-5, cols = dysfunctional 1-5.
 *
 *               dys: 1 like  2 must  3 neut  4 live  5 dislike
 *   fun 1 like        Q        A       A       A        O
 *   fun 2 must-be     R        I       I       I        M
 *   fun 3 neutral     R        I       I       I        M
 *   fun 4 live-with   R        I       I       I        M
 *   fun 5 dislike     R        R       R       R        Q
 */
const EXPECTED = [
  ['Q', 'A', 'A', 'A', 'O'],
  ['R', 'I', 'I', 'I', 'M'],
  ['R', 'I', 'I', 'I', 'M'],
  ['R', 'I', 'I', 'I', 'M'],
  ['R', 'R', 'R', 'R', 'Q'],
];

const POS_NAMES = ['like', 'must-be', 'neutral', 'live-with', 'dislike'];

test('classify(): EVERY one of the 25 evaluation-table cells matches the PDF', () => {
  for (let f = 1; f <= 5; f++) {
    for (let d = 1; d <= 5; d++) {
      const expected = EXPECTED[f - 1][d - 1];
      const actual = classify(f, d);
      assert.equal(
        actual,
        expected,
        `cell (functional=${f} "${POS_NAMES[f - 1]}", dysfunctional=${d} "${POS_NAMES[d - 1]}") ` +
          `expected ${expected}, got ${actual}`,
      );
    }
  }
});

test('the engine EVALUATION_TABLE constant equals the independently re-typed table', () => {
  assert.deepEqual(EVALUATION_TABLE.map((row) => [...row]), EXPECTED);
});

test('classify(): corner / diagonal cells (the easy-to-get-wrong ones)', () => {
  assert.equal(classify(1, 1), 'Q'); // like / like
  assert.equal(classify(1, 5), 'O'); // like / dislike
  assert.equal(classify(5, 1), 'R'); // dislike / like
  assert.equal(classify(5, 5), 'Q'); // dislike / dislike
  // entire interior 3x3 block is Indifferent
  for (let f = 2; f <= 4; f++) {
    for (let d = 2; d <= 4; d++) {
      assert.equal(classify(f, d), 'I', `interior cell (${f},${d}) should be I`);
    }
  }
});

test('classify(): accepts label strings (canonical + variant wordings)', () => {
  // canonical Kano (1984)
  assert.equal(classify('I like it that way', 'I dislike it that way'), 'O');
  assert.equal(classify('It must be that way', 'I dislike it that way'), 'M');
  assert.equal(classify('I like it that way', 'I am neutral'), 'A');
  // Chapman & Callegaro (2022) variant
  assert.equal(classify('I like it', 'I dislike it'), 'O');
  // Witell (2013) variant
  assert.equal(classify('I like it that way', 'I am expecting it to be that way'), 'A');
  // mixed number + label
  assert.equal(classify(1, 'dislike'), 'O');
});

test('classify(): rejects out-of-range / invalid answers', () => {
  assert.throws(() => classify(0, 1), RangeError);
  assert.throws(() => classify(1, 6), RangeError);
  assert.throws(() => classify(1.5, 1), RangeError);
  assert.throws(() => classify('nonsense', 1), RangeError);
  assert.throws(() => classify(null, 1), TypeError);
});

test('toPosition(): label-agnostic position resolution', () => {
  assert.equal(toPosition(3), 3);
  assert.equal(toPosition('LIKE'), 1);
  assert.equal(toPosition('  I Dislike It That Way '), 5);
});

// ---------------------------------------------------------------------------
// Better / Worse coefficients — worked examples from the PDFs (§5).
// ---------------------------------------------------------------------------

test('csCoefficients(): Sauerwein Fig.11 "Edge grip" — exact (kano-model2.pdf p.11)', () => {
  // A=7, O=33, M=50, I=10  -> Better 0.40, Worse -0.83
  const { better, worse, denominator } = csCoefficients({ A: 7, O: 33, M: 50, I: 10 });
  assert.equal(denominator, 100);
  assert.ok(Math.abs(better - 0.4) < 1e-9, `better=${better}`);
  assert.ok(Math.abs(worse - -0.83) < 1e-9, `worse=${worse}`);
});

test('csCoefficients(): Brand & Rese Table 1 "App-based bonus" — exact, R&Q excluded (S0969 p.6)', () => {
  // A=216, O=56, M=13, I=275, R=23, Q=24 -> CS+ 0.486, CS- -0.123
  const counts = { A: 216, O: 56, M: 13, I: 275, R: 23, Q: 24 };
  const { better, worse, denominator } = csCoefficients(counts);
  assert.equal(denominator, 560); // 216+56+13+275 — confirms R and Q are excluded
  assert.equal(Number(better.toFixed(3)), 0.486);
  assert.equal(Number(worse.toFixed(3)), -0.123);
});

test('csCoefficients(): Sauerwein "Service" — Worse exact, Better matches unrounded value', () => {
  // A=66, O=22, M=3, I=9 ; paper prints Better 0.89 (rounding artifact), Worse -0.25
  const { better, worse } = csCoefficients({ A: 66, O: 22, M: 3, I: 9 });
  assert.ok(Math.abs(worse - -0.25) < 1e-9, `worse=${worse}`);
  assert.ok(Math.abs(better - 0.88) < 1e-9, `better=${better}`); // (66+22)/100 = 0.88
});

test('csCoefficients(): denominator of 0 (only R/Q) returns 0, no divide-by-zero', () => {
  const { better, worse, denominator } = csCoefficients({ R: 5, Q: 2 });
  assert.equal(denominator, 0);
  assert.equal(better, 0);
  assert.equal(worse, 0);
});

// ---------------------------------------------------------------------------
// Aggregation, dominant category, and the M>O>A>I tie-break.
// ---------------------------------------------------------------------------

test('dominantCategory(): plain mode', () => {
  assert.equal(dominantCategory({ M: 1, O: 5, A: 2, I: 1, R: 0, Q: 0 }), 'O');
  assert.equal(dominantCategory({ M: 0, O: 0, A: 0, I: 0, R: 0, Q: 0 }), null);
});

test('dominantCategory(): tie broken by M > O > A > I > R > Q', () => {
  assert.equal(dominantCategory({ M: 3, O: 3, A: 0, I: 0 }), 'M'); // M beats O
  assert.equal(dominantCategory({ M: 0, O: 3, A: 3, I: 0 }), 'O'); // O beats A
  assert.equal(dominantCategory({ M: 0, O: 0, A: 3, I: 3 }), 'A'); // A beats I
  assert.equal(dominantCategory({ M: 2, O: 2, A: 2, I: 2 }), 'M'); // 4-way tie -> M
  assert.equal(dominantCategory({ R: 4, Q: 4 }), 'R'); // R beats Q
});

test('aggregate(): full flow over a feature, object-form responses', () => {
  // Hand-built distribution: classify each pair, then check counts/dominant/CS.
  const responses = [
    { functional: 1, dysfunctional: 5 }, // O
    { functional: 1, dysfunctional: 5 }, // O
    { functional: 2, dysfunctional: 5 }, // M
    { functional: 1, dysfunctional: 3 }, // A
    { functional: 3, dysfunctional: 3 }, // I
    { functional: 5, dysfunctional: 1 }, // R
    { functional: 1, dysfunctional: 1 }, // Q
  ];
  const r = aggregate(responses);
  assert.deepEqual(r.counts, { M: 1, O: 2, A: 1, I: 1, R: 1, Q: 1 });
  assert.equal(r.total, 7);
  assert.equal(r.dominant, 'O'); // mode
  // Better = (A+O)/(A+O+M+I) = (1+2)/(1+2+1+1) = 3/5 = 0.6
  // Worse  = -(O+M)/5 = -(2+1)/5 = -0.6
  assert.ok(Math.abs(r.better - 0.6) < 1e-9, `better=${r.better}`);
  assert.ok(Math.abs(r.worse - -0.6) < 1e-9, `worse=${r.worse}`);
});

test('aggregate(): accepts [functional, dysfunctional] pair-form responses', () => {
  const r = aggregate([
    [1, 5], // O
    [2, 5], // M
    [2, 5], // M
  ]);
  assert.deepEqual(r.counts, { M: 2, O: 1, A: 0, I: 0, R: 0, Q: 0 });
  assert.equal(r.dominant, 'M');
});

test('aggregate(): empty input -> zero counts, null dominant, 0 coefficients', () => {
  const r = aggregate([]);
  assert.deepEqual(r.counts, { M: 0, O: 0, A: 0, I: 0, R: 0, Q: 0 });
  assert.equal(r.total, 0);
  assert.equal(r.dominant, null);
  assert.equal(r.better, 0);
  assert.equal(r.worse, 0);
});

test('aggregate(): rejects non-array and malformed responses', () => {
  assert.throws(() => aggregate('nope'), TypeError);
  assert.throws(() => aggregate([42]), TypeError);
});
