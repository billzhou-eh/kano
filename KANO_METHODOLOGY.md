# Kano Model — Methodology (extracted from the project PDFs)

This document records the precise Kano methodology **as stated in the PDFs in this folder**, with a
citation (PDF + page) for every rule, and explicit flags wherever the sources disagree. It is the
specification the classification engine (`src/kano.js`) is built against.

## Source inventory

| # | File | Actual paper | Useful for methodology? |
|---|------|--------------|--------------------------|
| 1 | `kano-model2.pdf` | Sauerwein, Bailom, Matzler & Hinterhuber (1996), *The Kano Model: How to Delight Your Customers* (IX. Int. Working Seminar on Production Economics) | **YES — primary source.** Scale, full evaluation table, frequency rule, M>O>A>I rule, CS (Better/Worse) formulas, worked examples. |
| 2 | `An_analytical_Kano_model_for_customer_ne.pdf` | Xu, Jiao, Yang & Helander (2009), *An analytical Kano model for customer need analysis*, Design Studies 30(1) | **YES.** Scale + full evaluation table (Table 2). Uses its own analytical (vector) classifier instead of Better/Worse. |
| 3 | `FULLTEXT02.pdf` | Witell, Löfgren & Dahlgaard (2013), *Theory of attractive quality and the Kano methodology — past, present, future*, TQM | **YES.** Scale + full evaluation table (Fig. 1). No CS coefficients. |
| 4 | `Quality_Improvement_of_Industrial_Produc.pdf` | Muchtiar, Mufti & Yosri (2018), MATEC Web of Conferences 248, 03017 | **YES.** Scale + full evaluation table (Table 1) + Better/Worse formulas — but with a **deviating Worse formula** (see §4). |
| 5 | `1-s2.0-S0969698925003753-main.pdf` | Brand & Rese (2026), *Dual Response Kano method*, J. Retailing & Consumer Services 89, 104596 | **YES.** CS+/CS− formulas with worked numeric table; multiple resolution rules (mode, M>O>A>I, (O+A+M)>(I+R+Q), Category/Total Strength, Fong test). Scale & grid only as figures. |
| 6 | `6921.pdf` | Chapman & Callegaro (2022), *Kano Analysis: A Critical Survey-Science Review* | Partial. 5-pt scale; only 6 example mappings (no full grid); critiques the mode rule, recommends reporting the full distribution. |
| 7 | `1-kano1.pdf` | Kano (2015), *Advanced TQM for the New Era* | **NO.** About Q1/Q2/Q3 quality framework, not the questionnaire method. |
| 8 | `FULLTEXT01.pdf` | Hartmann & Lebherz, *Theory of attractive quality and the life cycle of quality attributes in additive manufacturing* | **NO.** Conceptual application; categories described in prose only. |
| 9 | `Empirical_research_on_Kano_s_model_and_c.pdf` | (file contains the same additive-manufacturing paper as #8) | **NO.** Duplicate-content conceptual paper; no instrument, grid, or formulas. |

The engine is built on the **agreement of sources 1–4** (the classic Berger et al. (1993) / Kano et al.
(1984) table), with CS coefficients per sources 1 and 5.

---

## 1. The functional / dysfunctional answer scale

**Every source that shows the instrument uses a 5-point scale**, with the *same five labels for both* the
functional and the dysfunctional question. Only the **wording** of the labels varies between authors;
the number of points (5) and their meaning/order are constant.

Canonical wording — Kano et al. (1984), as reproduced by **Sauerwein, p. 6** (`kano-model2.pdf`) and
**Xu et al., Table 1, p. 91** (`An_analytical...pdf`):

| # | Label (functional & dysfunctional, identical) | Short form |
|---|-----------------------------------------------|------------|
| 1 | I like it that way            | like |
| 2 | It must be that way           | must-be |
| 3 | I am neutral                  | neutral |
| 4 | I can live with it that way   | live-with |
| 5 | I dislike it that way         | dislike |

The functional question asks how the customer feels **if the product has** the feature; the dysfunctional
question asks how they feel **if the product does not have** it (Sauerwein, p. 5–6).

### Wording variants across the sources (number of points is always 5; only labels differ)
- **Berger et al. (1993), "American" version** — *"I enjoy it that way / I expect it that way / I am neutral / I can accept it / I dislike it that way"* (cited in Witell, `FULLTEXT02.pdf`, p. 8).
- **Witell Fig. 1** (`FULLTEXT02.pdf`, p. 22) — *"I like it that way / I am expecting it to be that way / I am neutral / I can accept it to be that way / I dislike it that way"*; headers abbreviated **Like / Expect / Neutral / Accept / Dislike**.
- **Chapman & Callegaro** (`6921.pdf`, p. 26) — *"I like it / I expect it / I feel neutral / I can tolerate it / I dislike it"*.
- **Muchtiar et al.** (`Quality_Improvement...pdf`, p. 2) — *"Like / Must-be / Neutral / May / Dislike"*.

> **Decision for the engine:** use the canonical Kano-1984 labels above (positions 1–5). The engine
> classifies by **position (1–5), not by label string**, so it is wording-agnostic; a label→position map
> is provided so any of the variants can be fed in.

---

## 2. The evaluation table (functional × dysfunctional → category)

**All four sources that print the grid agree on every single cell** (`kano-model2.pdf` Fig. 6 p. 6;
`An_analytical...pdf` Table 2 p. 92; `FULLTEXT02.pdf` Fig. 1 p. 22; `Quality_Improvement...pdf` Table 1
p. 2). **No cell disagreement was found.**

Rows = **functional** answer (1–5). Columns = **dysfunctional** answer (1–5).

| Functional ↓ \ Dysfunctional → | 1. like | 2. must-be | 3. neutral | 4. live-with | 5. dislike |
|--------------------------------|:-------:|:----------:|:----------:|:------------:|:----------:|
| **1. like**       | Q | A | A | A | O |
| **2. must-be**    | R | I | I | I | M |
| **3. neutral**    | R | I | I | I | M |
| **4. live-with**  | R | I | I | I | M |
| **5. dislike**    | R | R | R | R | Q |

Category legend (Sauerwein Fig. 6, p. 6): **A** Attractive, **O** One-dimensional, **M** Must-be,
**I** Indifferent, **R** Reverse, **Q** Questionable.

Key cells (the ones that are easy to get wrong), confirmed identically by all four printed grids:
- Top-left (like / like) = **Q**
- Top-right (like / dislike) = **O**
- Bottom-left (dislike / like) = **R**
- Bottom-right (dislike / dislike) = **Q**
- The entire interior 3×3 block (rows 2–4 × cols 2–4) = **I**

Interpretation notes (Sauerwein, p. 7): **Q** ("questionable") normally should not occur — it signals a
misunderstood or mis-marked question (Q-rate was <2% in their study). **R** ("reverse") means the
customer actively prefers the feature *absent*.

---

## 3. Resolving a feature's overall category from a distribution

Sources offer a hierarchy of rules. The engine implements the classic two:

**(a) Frequency / mode rule (primary).** "The easiest method is evaluation and interpretation according
to the frequency of answers" — assign the feature to the **most frequently occurring category**
(Sauerwein, p. 8–9, Fig. 10). Brand & Rese also use the mode as default ("classification most frequently
mentioned highlighted in grey", `S0969...pdf` p. 6).

**(b) M > O > A > I tie-break rule (when ambiguous).** "If the individual product requirements cannot be
unambiguously assigned to the various categories, the evaluation rule **M > O > A > I** is very useful"
(Sauerwein, p. 9). Also attributed to Berger et al. (1993) by Brand & Rese (`S0969...pdf` p. 2).

> **Decision for the engine:** dominant category = the category with the highest count among
> **{M, O, A, I}** (and R, Q if they somehow win); ties are broken in the strict priority order
> **M > O > A > I > R > Q**. The M>O>A>I order is exactly the source rule; R and Q are appended last
> because the sources treat them as non-substantive (R = reverse interest, Q = invalid), and Sauerwein
> only ever applies the rule among M/O/A/I.

### Alternative rules present in the sources (documented, not the engine default)
- **(O+A+M) > (I+R+Q) reclassification** — if the "positive" categories together outweigh the rest, classify as whichever of O/A/M dominates; applied by Brand & Rese to reclassify *free in-store WiFi* from Indifferent to Attractive (`S0969...pdf` p. 6, Berger et al. 1993).
- **Category Strength & Total Strength** (Lee & Newcomb 1997) — category strength = (top % − 2nd % ); a 6% gap is the cited threshold; Total Strength = %A + %O + %M (`S0969...pdf` p. 2, p. 6).
- **Fong test** (Fong 1996) — significance test of whether the top two categories are distinguishable: `|a−b| < 1.65·√[((a+b)(2n−a−b))/2n]` ⇒ classification *not* significant (`S0969...pdf` p. 6).
- **Report the full distribution instead of a single category** — Chapman & Callegaro explicitly recommend *not* reporting only a modal category but the proportion aligning with every category (`6921.pdf` p. 37).

The engine therefore **always returns the full category counts** alongside the dominant category, so the
caller can apply any of these richer rules.

---

## 4. Better / Worse (customer-satisfaction, "CS") coefficients

The user-supplied formulas are:

```
Better = (A + O) / (A + O + M + I)
Worse  = -(O + M) / (A + O + M + I)
```

**These are confirmed by the primary sources.**

- **Sauerwein, p. 10** (`kano-model2.pdf`):
  - Extent of satisfaction (Better): `(A+O) / (A+O+M+I)`
  - Extent of dissatisfaction (Worse): `(O+M) / (A+O+M+I) × (−1)`
  - "A minus sign is put in front of the CS-coefficient of customer dissatisfaction…"; Better ranges 0→1, Worse ranges 0→−1.
- **Brand & Rese, p. 6** (`S0969...pdf`), Eqs. (3)–(4):
  - `CS+ = (#A + #O) / (#A + #O + #M + #I)`, range [0;1]
  - `CS− = −(#O + #M) / (#A + #O + #M + #I)`, range [0;−1]

**Denominator = A + O + M + I in every case; R and Q are excluded.** Confirmed numerically by Brand &
Rese's own worked table (see §5): App-based bonus program CS+ = (216+56)/(216+56+13+275) = 272/560 =
0.486 — only by excluding R(23) and Q(24) does the denominator equal 560.

### ⚠ Source disagreement — Muchtiar et al. (2018)
`Quality_Improvement...pdf`, p. 3, prints the Worse coefficient as:

```
Worse = (A + M) / (A + O + M + I)        ← deviates from every other source
```

i.e. numerator **(A + M)** and **no negative sign** (reported as a positive percentage). This contradicts
Sauerwein, Brand & Rese, and the original Berger et al. (1993) definition, all of which use **(O + M)**.
Its own prose even describes Worse as "the decline of customer satisfaction on the unavailability of
**O & M** feature" — i.e. the *text* says O+M while the *formula* prints A+M.

> **Conclusion:** the Muchtiar `(A+M)` numerator is treated as a **typographical error** in that paper and
> is **not** used. The engine implements the consensus formula `Worse = −(O+M)/(A+O+M+I)`. (The sign
> convention — Sauerwein/Brand & Rese return a negative Worse; Muchtiar reports a positive magnitude — is
> a presentation choice; the engine follows the majority and returns Worse ≤ 0.)

---

## 5. Worked numeric examples (used as test fixtures)

**Sauerwein, Fig. 11, p. 11** (`kano-model2.pdf`) — counts as percentages summing to 100:

| Requirement | A | O | M | I | Better | Worse |
|-------------|---|---|---|---|--------|-------|
| Edge grip   | 7 | 33 | 50 | 10 | 0.40 | −0.83 |
| Ease of turn| 11| 46 | 31 | 12 | 0.57 | −0.78\* |
| Service     | 66| 22 | 3  | 9  | 0.89\*\* | −0.25 |

- Edge grip checks exactly: Better = (7+33)/100 = **0.40**; Worse = −(33+50)/100 = **−0.83**. ✔
- \* Ease of turn: −(46+31)/100 = **−0.77**, but the paper prints **−0.78**. Minor **rounding artifact**
  in the source — the displayed A/O/M/I are themselves rounded from the raw frequencies in Fig. 10
  (A=10.4, O=45.1, M=30.5, I=11.5), and Fig. 11's coefficients were computed from the unrounded data then
  rounded separately.
- \*\* Service: (66+22)/100 = **0.88**, but the paper prints **0.89** — same rounding artifact.

**Brand & Rese, Table 1, p. 6** (`S0969...pdf`) — raw counts incl. R and Q (these are clean, exact to 3 dp
because the denominator deliberately excludes R and Q):

| Attribute | A | O | M | I | R | Q | CS+ | CS− |
|-----------|---|---|---|---|---|---|-----|-----|
| App-based bonus program | 216 | 56 | 13 | 275 | 23 | 24 | 0.486 | −0.123 |
| Smart mirror            | 229 | 42 | 5  | 276 | 33 | 22 | 0.491 | −0.085 |
| Free in-store WiFi      | 187 | 71 | 46 | 258 | 19 | 26 | 0.459 | −0.208 |

- App-based: CS+ = (216+56)/(216+56+13+275) = 272/560 = **0.4857 → 0.486**; CS− = −(56+13)/560 =
  −69/560 = **−0.1232 → −0.123**. ✔ (Exact — confirms R, Q excluded from the denominator.)

These two fixtures (Sauerwein edge grip; Brand & Rese app-based) are asserted exactly in the unit tests;
the rounding-artifact rows are documented but not asserted to the source's printed 2nd decimal.

---

## 6. Summary of decisions baked into the engine

1. **Scale:** 5 points, classified by position 1–5 (label-agnostic, with a variant-label map).
2. **`classify(functional, dysfunctional)`:** the literal 5×5 table in §2 — a hard-coded lookup, no heuristics. Out-of-range inputs throw.
3. **`aggregate(...)`:** returns `{counts, total, dominant, better, worse}` where
   - `counts` = full distribution over M/O/A/I/R/Q (supports any of the §3 alternative rules),
   - `dominant` = mode with **M > O > A > I > R > Q** tie-break (§3),
   - `better`, `worse` = §4 consensus formulas; denominator A+O+M+I; if that denominator is 0 the coefficients are returned as `0` (avoids divide-by-zero when only R/Q responses exist).
4. **One documented deviation rejected:** Muchtiar's `Worse=(A+M)/…` (§4).
5. **No cell-level disagreements** exist between sources on the evaluation table itself.
