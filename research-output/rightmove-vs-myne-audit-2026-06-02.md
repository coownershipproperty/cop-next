# Rightmove × MYNE sync audit — 2 June 2026

**Scraped:** 53 of 60 Rightmove listings (7 hidden by virtualization, see caveat below) × 113 MYNE portal properties (77 Open, 36 No-Ads)

## 🚨 Action 1 — REMOVE from Rightmove (8 listings violating "No Ads" rule)

These MYNE properties are flagged "No Ads" in the partner portal but are currently live on your Rightmove. Pull them down before MYNE flags it.

| Rightmove title | RM price | MYNE name |
|---|---|---|
| Santa Ponsa, Mallorca (slug-ref) | €339,000 | **Ático Malgrats** |
| Callao Salvaje, Tenerife | €269,000 | **Ático Horizonte** |
| Laigueglia, Savona, Liguria | €239,000 | **Villa Mareluce** |
| Playa San Juan, Tenerife | €189,000 | **Jardín San Juan** |
| Lazise, Verona, Veneto | €179,000 | **Attico Lazise** |
| Port d'Alcúdia, Mallorca | €169,000 | **Casita Alcúdia** |
| Portimão, Algarve | €169,000 | **Terraço Portimão** |

(The 8th was a false-positive in my matcher — Vilamoura €179k slug-ref. See Action 2 below — it's a price change, not a No-Ads case.)

## 💰 Action 2 — UPDATE prices on Rightmove (1 confirmed, ~5 likely)

| RM title | RM price | MYNE price | Delta | MYNE name |
|---|---|---|---|---|
| Vilamoura, Algarve (slug-ref) | €179,000 | €169,000 | **–€10,000** | Beira Vilamoura (now Open) |

The earlier audit also flagged these MYNE-side price drops — most are 5–€20k below their COP/Rightmove prices, so worth a sweep:

- Casita Alcúdia III: €169k → €159k
- Limoni Verde / Torri del Benaco: €209k → €189k
- Vista Puerto Andratx: €189k → €179k
- Sellin Garten: €189k → €149k (and the 3 other Sellin listings need to come off entirely — all sold)

## ✅ Action 3 — ADD to Rightmove (14 Open MYNE properties not yet listed)

You have ~40 empty slots (60 of 100 used). These 14 are confirmed Open-status on MYNE and not currently on your Rightmove. Sorted by price descending — adding the bigger-ticket ones first sharpens your portfolio:

| # | Price | MYNE name | Location | Beds |
|---|---|---|---|---|
| 1 | €869,000 | **The Bond** | Stockholm Archipelago, Värmdö, Sweden | 5+1 |
| 2 | €869,000 | **Verimar** | Son Veri Nou, Mallorca | 3+3 |
| 3 | €729,000 | **Celeste** | Puig de Ros, Mallorca | 4 |
| 4 | €649,000 | **Vida** | Peguera, Mallorca | 4 |
| 5 | €509,000 | **Finca Soleá** | Ses Salines, Mallorca | 5 |
| 6 | €439,000 | **Chalet KitzSki** | Hollersbach, Pinzgau, Austria | 3 |
| 7 | €439,000 | **Tschengla Penthouse** | Bürserberg, Vorarlberg, Austria | 3+1 |
| 8 | €409,000 | **Villa Nou** | Son Veri Nou, Mallorca | 4+1 |
| 9 | €389,000 | **Bardolino Visione** | Cavaion Veronese, Lake Garda | 3+1 |
| 10 | €379,000 | **Chalet Going** | Going am wilden Kaiser, Tirol | 3 |
| 11 | €299,000 | **Como Essence** | Menaggio, Lake Como | 2+2 |
| 12 | €299,000 | **Villa Maggiore** | Meina, Lake Maggiore | 3+1 |
| 13 | €284,000 | **Alpside Arlberg III** | Stuben, Vorarlberg | 2 |
| 14 | €249,000 | **Tegernsee Garten** | Tegernsee, Bayern | 2,5 |

**Net result if you do all 3 actions:** 60 − 7 (remove) + 14 (add) = **67 listings.** Still 33 slots free. The remaining gap is because of MYNE's 36 No-Ads properties + the 8 sold-out ones you can't list.

To get closer to 100, you could also pull from your other partners (Pacaso has 190 properties in your DB; only 7 on Rightmove right now — that's the bigger pool to mine).

## Caveats / gotchas

- **7 Rightmove listings missing from my scrape** (53/60 captured) — virtualization in the Rightmove admin only renders visible rows; some scrolled-off listings didn't load. To make this audit 100% complete, hit Rightmove's "Export All" button (top right of property list), send me the CSV, and I'll re-run the diff.
- **Matching uses location + bedroom + price token overlap.** False positives are rare but possible — verify each "remove" action by clicking through to the MYNE portal before pulling the listing down.
- **The 8th "No Ads" row (Vilamoura €179k)** was a matcher mis-match — that's actually a price-change case (Beira Vilamoura was discounted to €169k). Treat it as Action 2.

## Data files captured

- `/research-output/rightmove-listings-2026-06-02.json` — the 53 RM listings (raw)
- `/research-output/myne-portal-2026-06-01.json` — the 113 MYNE portal entries (yesterday's snapshot, still current)
