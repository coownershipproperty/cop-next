/**
 * lib/galleryNurture.js
 *
 * Builds the three gallery-nurture emails (Day 1 / Day 4 / Day 10) from the
 * fact tables and renders them through emails/gallery-nurture.tsx.
 *
 * Split out from lib/followupSequence.js on purpose: the sequence file owns
 * *when* an email goes out and the queue rules; this file owns *what it
 * says*. Previewing a design should never mean loading the scheduler.
 *
 * Nothing here invents a figure. Everything comes back from
 * lib/nurtureFacts.js, which only surfaces verified rows — if a home has no
 * verified running cost, the email quietly drops that line rather than
 * guessing at one.
 */
import { render } from '@react-email/render';
import GalleryNurtureEmail from '@/emails/gallery-nurture';
import { factViewsForSlugs, similarFactViews } from '@/lib/nurtureFacts';
import { unsubUrl } from '@/lib/unsub';

const BASE = 'https://co-ownership-property.com';
const REPLY_TO = 'dylan@co-ownership-property.com';

export const NURTURE_STEPS = ['day1', 'day4', 'day10'];
export const NURTURE_DELAY_DAYS = { day1: 1, day4: 4, day10: 10 };

const shortPlace = (h) => String(h.place || '').split(',')[0].trim() || h.name;

function joinNames(homes) {
  const names = homes.map(shortPlace);
  if (names.length <= 1) return names[0] || '';
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

/** The Day-10 button: a prefilled mail to Dylan. It is the one call to
 *  action that works in every client, and a reply is what we actually want. */
function introduceUrl(homes, firstName) {
  const titles = homes.map(h => h.title || h.name).filter(Boolean);
  const subject = titles.length === 1
    ? `Yes — please introduce me (${shortPlace(homes[0])})`
    : 'Yes — please introduce me';
  const body = titles.length
    ? `Hi Dylan,\n\nYes please — I’d like an introduction to the team behind ${titles.join(' and ')}.\n\n`
    : `Hi Dylan,\n\nYes please — I’d like an introduction.\n\n`;
  return `mailto:${REPLY_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Where "see more" goes: the country hub when the homes agree on one. */
function browseFor(homes) {
  const countries = [...new Set(homes.map(h => h.country).filter(Boolean))];
  if (countries.length === 1) {
    const c = countries[0];
    return {
      browseUrl: `${BASE}/our-homes/?country=${encodeURIComponent(c)}`,
      browseLabel: `Every home in ${c === 'USA' ? 'the USA' : c}`,
    };
  }
  return { browseUrl: `${BASE}/our-homes/`, browseLabel: 'See every home' };
}

export function subjectFor(step, homes) {
  const one = homes.length === 1;
  const place = homes.length ? shortPlace(homes[0]) : '';
  if (step === 'day1')  return one ? `The numbers for ${place}` : `The numbers for the homes you looked at`;
  if (step === 'day4')  return one ? `Two more like ${place}` : `Two more you haven’t seen`;
  // A subject line should sound like the person it is from. "Shall I"
  // reads as a letter; Dylan is sending an email. (David, 17 Sep 2026)
  return one ? `${place} — want me to introduce you?` : `Want me to introduce you?`;
}

/**
 * Build one step.
 *   db      — supabase admin client
 *   step    — 'day1' | 'day4' | 'day10'
 *   slugs   — what this person unlocked, newest first
 *   Returns { subject, html, homes, similar } or null when there is nothing
 *   sendable left (every home sold or hidden, or day 4 with no similar).
 */
export async function buildNurtureStep(db, { step, slugs, firstName, email }) {
  const homes = (await factViewsForSlugs(db, slugs)).slice(0, 3);
  if (!homes.length) return null;

  let similar = [];
  let similarLabel = '';
  let similarPrice = false;
  if (step === 'day4') {
    const found = await similarFactViews(db, homes[0], { limit: 2, exclude: homes.map(h => h.slug) });
    similar = found.homes;
    similarLabel = found.tierLabel;
    similarPrice = found.similarPrice;
    if (!similar.length) return null;  // nothing to offer — don't send an empty email
  }

  const props = {
    step,
    firstName: firstName || 'there',
    homes,
    similar,
    similarLabel,
    similarPrice,
    introduceUrl: introduceUrl(homes, firstName),
    ...browseFor(step === 'day4' && similar.length ? similar : homes),
    unsubscribeUrl: unsubUrl(email),
  };

  const html = await render(GalleryNurtureEmail(props));
  return { subject: subjectFor(step, homes), html, homes, similar, similarLabel, similarPrice };
}

export { joinNames };
