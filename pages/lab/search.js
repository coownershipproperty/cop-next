/**
 * /lab/search — the AI search, on its own page, before it goes anywhere near
 * the homepage.
 *
 * This exists so the thing can be used and judged in full without publishing
 * it. The page is noindex/nofollow, is not in the sitemap, and is not linked
 * from any navigation, so the only way to reach it is to know the URL.
 * pages/index.js is untouched.
 *
 * The panel under the search is deliberately visible here and will not exist on
 * the homepage. It reports what the search actually did — how many homes it
 * considered, how many had map data, whether the AI answered or the free
 * keyword parser did — because the whole point of a preview is to see the
 * working, not just the result.
 */

import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartSearch from '@/components/SmartSearch';

const NAVY = '#2C4A5E';
const GOLD = '#C9A84C';
const CREAM = '#F5F2EC';
const MUTED = '#6B8A9E';

/** David's own examples from the brief, plus the awkward ones worth testing. */
const TESTS = [
  'I like scuba diving, I like padel, I want to be near a beach — 3 bed in Mallorca, somewhere quiet, not too touristic',
  'Somewhere quiet and not too touristic',
  'I like padel',
  '3 bed in Mallorca',
  'Near a beach, under €150k',
  'Somewhere the kids will love with a pool, walking distance to restaurants',
  'A ski place where I can walk to the lift, with a fireplace',
  'Somewhere I can rent out when I am not using it',
  'Quiet, authentic, great food, nowhere full of tourists, and I want to hike',
  'A penthouse in Miami with a gym nearby',
  'Somewhere in Japan near a golf course',
  // Nobody in the brief asked for these. That is the point of them: the search
  // has to be as good for the cyclist and the museum-goer as it is for the diver.
  'Long walks and hiking trails, somewhere in the mountains',
  'Somewhere I can cycle, near a train station so we do not have to fly',
  'Museums, galleries and a bit of history, plus good restaurants',
  'We sail, and the kids want a water park',
  'Wine country, somewhere with vineyards and good food',
  'Somewhere I can work from for a month — coworking, decent wifi, a town nearby',
  'Lakes, a national park, plenty of things to do outdoors',
  'A ferry to the islands and somewhere warm to swim',
];

export default function LabSearch() {
  const [seed, setSeed] = useState(0);

  return (
    <>
      <Head>
        <title>Search preview — internal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Header />

      <main className="lab">
        <div className="banner">
          <strong>Internal preview.</strong> Not published, not linked, not indexed. The
          homepage is unchanged.
        </div>

        <section className="stage">
          <div className="inner">
            <p className="eyebrow">Find your home</p>
            <h1>Tell us what you actually want.</h1>
            <p className="sub">
              Not filters. A sentence. We check what is genuinely near all 355 homes —
              real dive centres, real padel courts, real beaches, measured — and rank
              them against what you said.
            </p>
            <SmartSearch key={seed} variant="hero" />
          </div>
        </section>

        <section className="tests">
          <h2>Test queries</h2>
          <p className="note">
            Click one to load it. The interesting ones are the short and the impossible:
            &ldquo;I like padel&rdquo; should still rank sensibly, and a place we do not
            cover should say so plainly rather than quietly returning the wrong country.
          </p>
          <ul>
            {TESTS.map(t => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => {
                    // Remount the search with the query pre-filled via the URL
                    // hash, which SmartSearch reads on mount.
                    window.location.hash = `q=${encodeURIComponent(t)}`;
                    setSeed(s => s + 1);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .lab { background: ${CREAM}; }
        .banner {
          background: ${NAVY};
          color: #fff;
          font-family: var(--font-nunito), Arial, sans-serif;
          font-size: 14px;
          padding: 10px 24px;
          text-align: center;
          letter-spacing: .01em;
        }
        .banner strong { color: ${GOLD}; font-weight: 700; }
        .stage { padding: 56px 24px 40px; }
        .inner { max-width: 940px; margin: 0 auto; }
        .eyebrow {
          font-family: var(--font-nunito), Arial, sans-serif;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 12px;
          color: ${GOLD};
          margin: 0 0 10px;
        }
        h1 {
          font-family: var(--font-playfair), Georgia, serif;
          font-weight: 400;
          font-size: clamp(30px, 4.4vw, 46px);
          line-height: 1.12;
          color: ${NAVY};
          margin: 0 0 14px;
        }
        .sub {
          font-family: var(--font-nunito), Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: ${MUTED};
          max-width: 620px;
          margin: 0 0 28px;
        }
        .tests { max-width: 940px; margin: 0 auto; padding: 8px 24px 72px; }
        h2 {
          font-family: var(--font-playfair), Georgia, serif;
          font-weight: 400;
          font-size: 22px;
          color: ${NAVY};
          margin: 0 0 8px;
        }
        .note {
          font-family: var(--font-nunito), Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: ${MUTED};
          max-width: 620px;
          margin: 0 0 18px;
        }
        ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        button {
          font-family: var(--font-nunito), Arial, sans-serif;
          font-size: 13px;
          line-height: 1.35;
          text-align: left;
          color: ${NAVY};
          background: #fff;
          border: 1px solid rgba(44, 74, 94, .18);
          padding: 8px 12px;
          cursor: pointer;
          max-width: 420px;
        }
        button:hover { border-color: ${GOLD}; }
      `}</style>
    </>
  );
}
