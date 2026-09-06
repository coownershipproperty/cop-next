# Fractional Co-Ownership Operators — Open Dataset

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Updated](https://img.shields.io/badge/Updated-2026--06--03-blue.svg)](#changelog)

The **first open, comprehensive index of fractional / co-ownership property operators worldwide.** Maintained quarterly by [Co-Ownership Property](https://co-ownership-property.com).

## What's in here

A machine-readable inventory of companies globally that sell **deeded fractional or co-ownership shares** of luxury residential property to end-buyers.

**Primary scope:** the **single-property 1/8-share model** — one share equals ownership of one specific home, held in a property-specific LLC. This is the model COP itself works with and the dominant model in Europe and the US.

**Adjacent category (documented but not the focus):** portfolio / membership-pool operators — one share grants access to a rotating pool of homes. Listed for completeness with shorter profiles.

As of Q2 2026, the dataset covers operators across 14 countries in both categories combined.

For each operator:
- Founding details (year, founders, HQ city/country)
- Corporate filings where available (UK Companies House, Danish CVR)
- Pricing model (share size, headline price, ongoing fees)
- Resale/exit mechanics
- Geographic coverage + headline destinations
- Funding history where disclosed
- Source URLs for every fact

## Why this exists

Until now, there has been no neutral, comprehensive index of this category. Industry reports come from operators with obvious bias; trade press covers it sporadically; SherpaReport does the deepest profiles but isn't a structured dataset.

**Co-Ownership Property is the only entity that aggregates listings across multiple single-property co-ownership operators worldwide,** so we're uniquely positioned to publish operator-level data that's verifiable, comprehensive, and updated.

This dataset is offered under **CC BY 4.0** — free to use commercially or non-commercially, with attribution.

## How to cite

```
Co-Ownership Property. Fractional Co-Ownership Operators Open Dataset.
Co-Ownership Property, 2026. https://co-ownership-property.com/research/operators-dataset/.
Licensed CC BY 4.0.
```

## Methodology

**Primary scope — single-property co-ownership operators:** companies that sell deeded fractional shares of one specific home (e.g. 1/8 of a named villa, held in a property-specific LLC). This is the model the dataset is built around.

**Adjacent scope — portfolio / membership-pool operators:** included for completeness with shorter profiles. One share grants rotating access to multiple homes in a collection. A distinct buyer profile and economics from the single-property model.

**Excluded:** Timeshare operators (right-to-use only — no real-estate ownership), pure membership clubs (Inspirato, Exclusive Resorts), real-estate exchange clubs (ThirdHome), and closed-end real-estate funds (Equity Residences is flagged with that distinction).

**Verification:** Each operator's claims (property count, founding year, employee count, financials) are cross-checked against at least one independent source: regulatory filing (Companies House, CVR, etc.), SherpaReport profile, or trade-press article. Unverified claims are flagged.

**Update cadence:** Quarterly. Source URLs include a `last_verified` date per operator.

## Files

| File | Description |
|---|---|
| `operators-2026-06.json` | Latest snapshot (Q2 2026). 11 operators. JSON Schema documented inline. |
| `CHANGELOG.md` | What changed each quarter |
| `archive/` | Previous quarterly snapshots for time-series analysis |

## Quick stats (Q2 2026)

| Metric | Value |
|---|---|
| Single-property operators (primary scope) | 11+ |
| Adjacent: portfolio / membership-pool operators | 6 |
| Countries covered | 14 |
| Earliest operator founded | 2007 |
| Latest operator founded | 2024 |
| Lowest entry share price | ~$25,000 |
| Highest entry share price | ~$3,500,000 |

*Property counts are directional and refreshed quarterly; per-operator live counts are in the JSON.*

## Schema

The JSON file is documented inline (see `$schema` and `description` fields). High-level structure:

```jsonc
{
  "version": "1.0.0",
  "updated": "YYYY-MM-DD",
  "publisher": {...},
  "license": "CC-BY-4.0",
  "methodology": "...",
  "operators": [
    {
      "id": "kebab-case-slug",
      "name": "Display Name",
      "official_url": "...",
      "model": "single-property" | "portfolio",
      "founded": YYYY,
      "hq_city": "...",
      "hq_country": "...",
      "share_sizes": [...],
      "live_properties_approx": N,
      "geographic_coverage": [...],
      "data_sources": [...],
      "last_verified": "YYYY-MM-DD"
    }
  ]
}
```

## Contributing / corrections

Found an error or have an update? Open an issue or PR. We're particularly interested in:
- New operators we haven't indexed
- Updated property counts / pricing (with a source link)
- Financial filings we've missed
- Corrections to founder/funding history

## License

[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

You are free to share + adapt the dataset for any purpose, including commercial use, provided you give attribution to Co-Ownership Property and indicate if changes were made.

## Related

- [Co-Ownership Property](https://co-ownership-property.com) — the marketplace that maintains this dataset
- [Comparison guides](https://co-ownership-property.com/compare/) — neutral side-by-side analyses of the operators above
- [Glossary](https://co-ownership-property.com/glossary/) — 50-term reference for fractional / co-ownership terminology
- [Public DataFeed APIs](https://co-ownership-property.com/api/properties.json) — daily-updated property inventory across operators

---

**Maintainer:** Co-Ownership Property · info@co-ownership-property.com · [@coownershipproperty](https://www.linkedin.com/company/co-ownership-property/)
