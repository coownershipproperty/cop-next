/**
 * lib/propertyFactsPanel.js
 *
 * The numbers block on a property page, built server-side from
 * `property_facts` and handed to the browser as DATA, never as sentences.
 *
 * Two reasons it is shaped this way.
 *
 * First, the partner's name must never reach the client — that is a standing
 * rule and getStaticProps props are serialised into __NEXT_DATA__ verbatim.
 * So the partner is resolved here into an anonymous shape
 * ({ kind: 'minimum', nights: 44 }) and the name is left behind.
 *
 * Second, the page is read in ten languages. A finished English sentence
 * cannot be translated at render time; a kind and a number can. The page's
 * own COPY block turns { kind:'minimum', nights:44 } into "44 nights a year,
 * minimum" or "44 Nächte im Jahr, mindestens".
 *
 * Nothing is estimated. `monthly` is only ever a figure the fact table has at
 * `verified` confidence — everywhere else it comes back null and the row is
 * simply not rendered. That matters more here than anywhere: this block is
 * the reason a buyer trusts us over the operator's own page.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { usageShape, costsShape, denominatorOf, financingKind } from '@/lib/partnerTerms';

/** A shares-left figure is only worth printing when it is real and recent. */
function sharesLeft(f, denom) {
  const n = Number(f && f.shares_remaining);
  if (!Number.isFinite(n) || n <= 0 || n >= denom) return null;
  const checked = f.availability_checked_at ? Date.parse(f.availability_checked_at) : NaN;
  if (!Number.isFinite(checked) || Date.now() - checked > 45 * 86400000) return null;
  return n;
}

/**
 * `property_facts` is not readable with the anon key — RLS closed it in the
 * September audit, and rightly so: the table carries our cost intelligence,
 * partner references and portal URLs. Reading it therefore needs the service
 * role, which is safe here because getStaticProps runs on the server and what
 * ships to the browser is the finished panel, not the row.
 *
 * If the service key is not in the environment (a preview build, a local dev
 * without it) we fall back to the caller's client and simply get nothing
 * back. The page renders without the panel; it never fails over it.
 */
function readerFor(fallback) {
  try {
    return createSupabaseAdminClient();
  } catch (e) {
    return fallback;
  }
}

/**
 * @param db        supabase client to fall back to (the page's anon client)
 * @param property  the raw properties row, partner included
 * @returns null when there is nothing worth showing, otherwise
 *   { denom, monthly, currency, usage: {kind,nights,denom}, costsKind,
 *     sharesLeft, verifiedOn }
 */
export async function buildFactsPanel(db, property) {
  if (!property || !property.slug) return null;

  let f = null;
  try {
    const { data } = await readerFor(db)
      .from('property_facts')
      .select('monthly_cost, currency, usage_nights, shares_remaining, availability_checked_at, confidence, last_verified_at')
      .eq('slug', property.slug)
      .maybeSingle();
    f = data || null;
  } catch (e) {
    return null;   // the page renders fine without it; it never fails over this
  }

  const denom    = denominatorOf(property);
  const verified = f && f.confidence === 'verified';
  const usage    = usageShape(property, verified ? f.usage_nights : null);
  const monthly  = verified && f.monthly_cost ? Number(f.monthly_cost) : null;
  const left     = f ? sharesLeft(f, denom) : null;

  // A panel with nothing in it but the share denominator is noise.
  if (!monthly && !left && usage.kind === 'fraction') return null;

  return {
    denom,
    // Whether a mortgage calculator would be honest on this listing.
    mortgage: financingKind(property) === 'mortgage',
    monthly,
    currency: (f && f.currency) || property.currency || 'EUR',
    usage,
    costsKind: costsShape(property),
    sharesLeft: left,
    verifiedOn: monthly && f.last_verified_at ? String(f.last_verified_at).slice(0, 10) : null,
  };
}
