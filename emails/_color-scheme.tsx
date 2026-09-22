import * as React from 'react';

/**
 * emails/_color-scheme.tsx — the dark-mode declaration every COP email carries.
 *
 * Added 22 Sep 2026 with the black/white/grey re-skin. The design is now black
 * type on white, which is exactly the case a mail client's automatic dark mode
 * handles worst: Outlook.com and the Gmail app on Android will invert colours
 * whether or not an email asks them to, and an email that leaves any surface
 * undeclared gets a different colour for it than for its neighbour — white
 * cards on a grey band turn into grey cards on a black band with a hairline
 * that has vanished.
 *
 * Three things, in order of how much they matter:
 *
 *  1. `color-scheme` and `supported-color-schemes`. Apple Mail, iOS Mail and
 *     Outlook for Mac read these and stop force-inverting once they see them.
 *     Without them, Apple Mail inverts; with them, it respects the inline
 *     colours. This is the one that does most of the work.
 *  2. A `prefers-color-scheme: dark` block that restates the palette rather
 *     than fighting it: the page goes near-black, body copy goes light grey,
 *     the white cards become #1b1b1b and the hairlines lift to something that
 *     is still visible. Apple Mail and iOS honour it. Gmail strips the whole
 *     `<style>` element, which is why nothing in any template depends on it.
 *  3. `!important` on those rules, because the inline styles they override
 *     would otherwise win.
 *
 * The classes are opt-in: a template marks its surfaces with `dm-page`,
 * `dm-card`, `dm-ink`, `dm-muted` or `dm-rule` and gets sensible dark
 * behaviour. A template that marks nothing still renders correctly — it just
 * gets whatever the client decides, as before.
 */
export function EmailColorScheme() {
  return (
    <>
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <style>{`
        @media (prefers-color-scheme: dark) {
          .dm-page  { background-color:#0f0f0f !important; }
          .dm-card  { background-color:#1b1b1b !important; border-color:#2e2e2e !important; }
          .dm-ink   { color:#f2f2f2 !important; }
          .dm-muted { color:#a8a8a8 !important; }
          .dm-rule  { border-color:#2e2e2e !important; background-color:#2e2e2e !important; }
          .dm-invert-btn { background-color:#f2f2f2 !important; color:#111111 !important; }
        }
      `}</style>
    </>
  );
}

export default EmailColorScheme;
