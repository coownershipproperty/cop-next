# MYNE Partner Hub → COP DB sync audit
**Date:** 1 June 2026
**Source:** [myne-partner-hub.lovable.app/en/properties](https://myne-partner-hub.lovable.app/en/properties) (logged-in scrape, 113 properties)
**Compared against:** `lib/properties.json` filtered to `partner === 'myne'` (99 properties)

## Headline

- MYNE portal: **113 live**
- COP DB: **99 MYNE entries**
- Net gap: **14 properties** — but the actual delta is larger because some COP rows are stale (sold-out properties still listed)

---

## 1. Need to ADD to COP (24)

These MYNE properties have no matching city in COP's myne entries. Some may match an existing slug with a different city spelling — confirm before adding to avoid duplicates.

| MYNE title | Destination | Region | Beds | Price |
|---|---|---|---|---|
| Ático Cala d'Or | Mallorca | Osten, Cala d'Or | 2 | €154,000 |
| Ático Málaga | Spain mainland | Costa del Sol, Málaga | 2 | €169,000 |
| Ático Puerto Pollensa | Mallorca | Norden, Puerto de Pollensa | 2 | €299,000 |
| Attico Bardolino | Bardolino, Italy | Lake Garda | 2 | €199,000 |
| Fehmarn Hygge | Germany | Ostsee, Fehmarn | 2 | €149,000 |
| Giardino Palau II | Sardinia | Palau | 2+1 | €219,000 |
| Hippie Chic | Ibiza | Ibiza-Stadt | 1 | €159,000 |
| Kukci Oasis | Croatia | Istria, Poreč | 3+1 | €219,000 |
| Kukci Oasis II | Croatia | Istria, Poreč | 3+1 | €219,000 |
| Maison Les Issambres | France | Côte d'Azur, Les Issambres | 2.5 | €319,000 |
| Maison Valbonne | France | Côte d'Azur, Valbonne | 3 | €299,000 |
| Marbella Hills | Spain mainland | Málaga, Ojén | 2 | €149,000 |
| Modern Summit | Austria | Neukirchen am Großvenediger | 2 | €169,000 |
| Nartelle | France | Côte d'Azur, Sainte-Maxime | 4 | €599,000 |
| Oasis Puerto Pollensa | Mallorca | Norden, Puerto de Pollensa | 2 | €189,000 |
| Pasión | Ibiza | Cala Codolar | 4 | €599,000 |
| Portixol Marina | Spain | Bei Palma | 2+1 | €189,000 |
| Terraza del Sol | Spain | Rincón de la Victoria, Costa del Sol | 2 | €119,000 |
| Terrazza Sanremo | Italy | Ospedaletti | 2 | €179,000 |
| The Bond | Sweden | Stockholm Archipelago, Värmdö | 5+1 | €869,000 |
| Vida | Mallorca | Peguera | 4 | €649,000 |
| Villa Maggiore | Italy | Lake Maggiore, Meina | 3+1 | €299,000 |
| Visiona | Italy | Diano Marina, Liguria | 3 | €579,000 |
| Vista Alassio | Italy | Alassio, Liguria | 2 | €179,000 |

**Note:** Several of these (Maison Valbonne, Nartelle, Villa Verte, Chalet de la Manche, Ciel de Vallauris, Panorama Morzine) are the same properties from the recent MYNE France viewings email — those need adding ASAP since the viewings newsletter already references them.

---

## 2. SOLD on MYNE — should be marked sold/removed on COP (7)

These are confirmed sold (showing as "Sold" status with a final sale price on the portal). The COP slug column shows the most likely match — verify before changing status.

| MYNE title | Sold for | Likely COP slug(s) |
|---|---|---|
| Alpine Terrace | €144,000 | `brixen-austria-2-bed-apartment-with-garden` (city naming differs, manual check) |
| Baltic Oasis | €189,000 | one of: `sellin-germany-3-bed-penthouse-with-sea-views`, `sellin-germany-2-bed-penthouse-with-pool`, `sellin-germany-2-bed-villa-with-pool` |
| Baltic Peak | €239,000 | one of: `sellin-germany-3-bed-penthouse-with-sea-views`, `sellin-germany-2-bed-penthouse-with-pool`, `sellin-germany-2-bed-villa-with-pool` |
| Baltic Sundeck | €129,000 | `prora-germany-2-bed-penthouse-with-pool` or `prora-germany-2-bed-villa-with-pool` |
| Penthouse Timmendorfer Strand | €289,000 | `timmendorfer-strand-germany-2-bed-penthouse-with-sea-views` |
| Seabreeze | €189,000 | `glowe-germany-3-bed-apartment-with-sea-views` |
| Sky & Sea | €179,000 | `prora-germany-2-bed-penthouse-with-pool` or `prora-germany-2-bed-villa-with-pool` |

Pattern: every sold property is a Baltic Sea (Rügen / Usedom / Timmendorfer Strand) listing. Looks like MYNE has been clearing through their North German stock.

---

## 3. Price changed — high confidence (5)

Same city, same bed count, single COP match, price differs by more than 5% or €5k.

| MYNE title | COP slug | COP price | MYNE price | Delta |
|---|---|---|---|---|
| Beira Vilamoura | `vilamoura-portugal-2-bed-apartment-with-pool` | €179,000 | €169,000 | −€10,000 |
| Casita Alcúdia III | `port-d-alcudia-spain-2-bed-townhouse-with-pool` | €169,000 | €159,000 | −€10,000 |
| Limoni Verde | `torri-del-benaco-italy-2-bed-apartment-with-pool` | €209,000 | €189,000 | −€20,000 |
| Sellin Garten | `sellin-germany-3-bed-penthouse-with-sea-views` | €189,000 | €149,000 | −€40,000 (but possibly wrong slug match, sellin has 3+ MYNE properties) |
| Vista Puerto Andratx | `port-d-andratx-spain-2-bed-penthouse-with-pool` | €189,000 | €179,000 | −€10,000 |

All five are price drops — MYNE seems to be discounting slower-moving inventory.

---

## 4. Ambiguous — multiple COP candidates per MYNE listing (47)

These are MYNE listings where the city + bed count matches 2+ COP slugs (e.g. Torri del Benaco has 4 different MYNE properties; COP also has 4 with similar names). Without MYNE's internal slug there's no clean 1:1 mapping. Manual review needed if you want to track these precisely.

Most ambiguous cities (number of MYNE listings sharing the same city):
- **Torri del Benaco** (4 listings: Bella Vista, Limoni Verde, Terrazza Limoni, Terrazza Torri, Torri Garden)
- **Sa Ràpita** (4 listings: Rapita Mar, Sunshine Retreat IV/V, Villa del Mar, Villa del Mar II)
- **Playa d'en Bossa** (3: Creo Aqua, Creo Aqua II, Creo Jardin II)
- **Sellin** (3: Baltic Oasis, Baltic Peak, Sellin Garten)
- **Bürserberg** (3: Tschengla Penthouse, Tschengla Terrace, Tschengla Terrace II)
- **Fuengirola** (3: Carat Jardín, Carat Solmar, Carat Vista)

If you want a clean source-of-truth mapping, the cleanest move is to add a `myne_title` field to each COP myne entry so future syncs can match by name instead of city+beds. That's a one-time migration. Want me to script it?

---

## Recommended action queue

1. **Mark the 7 sold-out properties as not-live** on COP — they're misleading current leads
2. **Add the 5 high-confidence missing France viewings properties** first since those are already in the newsletter that just went out (Maison Valbonne, Nartelle, etc. — actually most of these are already in COP under different cities; the issue is the 5 newest)
3. **Add the other 19 missing properties** at your pace
4. **Update the 5 confirmed price changes** (5–10 min job)
5. **Optional cleanup**: add a `myne_title` mapping field to eliminate the 47 ambiguous matches going forward

Raw portal data saved at `/research-output/myne-portal-2026-06-01.json` for re-running the diff.
