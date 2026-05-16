# Blog corpus duplication audit
Run: 2026-05-12T23:33:26.026Z
Posts analyzed: **111**

## TL;DR
- 7802 distinct phrases (5–7 words) appear in ≥3 different posts.
- 2 H2/H3 headings are repeated across multiple posts.
- 0 posts have ≥20% of their sentences appearing in other posts.
- 27 of the AI-tell phrases were found at least once.

## Top 10 worst-offender posts (rewrite first)
| Rank | Template % | AI-tells | Slug |
|------|-----------|----------|------|
| 1 | 4.0% | 11 | `mallorca-hidden-gems-secret-coves-southwest-villages-guide` |
| 2 | 12.4% | 7 | `luxury-property-co-ownership-membership-model-smart-buyers` |
| 3 | 12.0% | 7 | `cote-vermeille-co-ownership-property-mediterranean-france` |
| 4 | 8.1% | 7 | `palm-springs-co-ownership-desert-luxury-guide-2026` |
| 5 | 7.4% | 7 | `uk-second-home-tax-co-ownership-european-property-savings` |
| 6 | 5.1% | 7 | `co-ownership-lisbon-principe-real-guide-2026` |
| 7 | 9.1% | 6 | `great-wealth-transfer-family-co-ownership-holiday-homes-2026` |
| 8 | 8.0% | 6 | `costa-smeralda-sardinia-co-ownership-destination-2026` |
| 9 | 7.9% | 6 | `costa-de-la-luz-cadiz-co-ownership-property-investment-guide-2026` |
| 10 | 7.6% | 6 | `foreign-buyer-property-restrictions-co-ownership-solution-2026` |

## Top 5 most-shared opening patterns
- **3 posts** start with: _"while mallorca and ibiza have long…"_
- **2 posts** start with: _"ibiza 8217 s property market has…"_
- **1 posts** start with: _"there are few stretches of european…"_
- **1 posts** start with: _"numbers and market reports only tell…"_
- **1 posts** start with: _"across europe and the united states…"_

## Top 15 repeated headings
- (106×) **H2**: Frequently Asked Questions
- (2×) **H2**: Living the Barcelona Co-Ownership Lifestyle

## Top 15 repeated phrases (5-7 word n-grams)
- (in 106 posts) "common questions frequently asked questions"
- (in 65 posts) "to existing co owners in"
- (in 64 posts) "existing co owners in the"
- (in 64 posts) "to existing co owners in the"
- (in 59 posts) "co owners in the property"
- (in 59 posts) "existing co owners in the property"
- (in 59 posts) "to existing co owners in the property"
- (in 57 posts) "days to years in advance"
- (in 57 posts) "from days to years in advance"
- (in 54 posts) "your personal belongings are taken"
- (in 54 posts) "personal belongings are taken out"
- (in 54 posts) "personal belongings are taken out of"
- (in 53 posts) "share to existing co owners"
- (in 53 posts) "your personal belongings are taken out"
- (in 52 posts) "faster than selling full property"

## Top 15 AI-tell phrases by post-coverage
- **82 posts** use "whether you" (133 total occurrences)
- **49 posts** use "one-eighth share" (116 total occurrences)
- **49 posts** use "world-class" (73 total occurrences)
- **49 posts** use "45 days per year" (62 total occurrences)
- **44 posts** use "1/8 share" (65 total occurrences)
- **29 posts** use "a fraction of the cost" (34 total occurrences)
- **24 posts** use "split eight ways" (29 total occurrences)
- **24 posts** use "sun-drenched" (24 total occurrences)
- **12 posts** use "co-ownership offers" (13 total occurrences)
- **10 posts** use "fraction of the price" (12 total occurrences)
- **8 posts** use "in this guide" (8 total occurrences)
- **7 posts** use "co-ownership allows" (8 total occurrences)
- **5 posts** use "properly structured llc" (5 total occurrences)
- **4 posts** use "breathtaking" (7 total occurrences)
- **4 posts** use "bespoke" (6 total occurrences)

## Files
- `opening-sentences.csv` — every post's opening, clustered
- `heading-frequency.csv` — repeated H2/H3 across the corpus
- `ngram-overlap.csv` — repeated 5–7 word phrases
- `ai-phrases-hits.csv` — per-post AI-tell hits
- `ai-phrases-summary.csv` — AI-tell phrases ranked by post-coverage
- `post-templating-score.csv` — **start here** — every post ranked by rewrite priority
