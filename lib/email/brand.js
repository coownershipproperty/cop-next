/**
 * lib/email/brand.js — the one place COP's email design is defined.
 *
 * Rewritten 22 Sep 2026 for the black/white/grey site redesign. The old
 * palette was navy + gold + cream, which no longer matches anything a
 * recipient sees when they click through: the site is black type on white
 * with grey supporting text, and the only warm colour left on it is in the
 * photographs. So the emails are the same. No gold, no navy, no cream.
 *
 * Every key the old templates used is still here, repointed — so a template
 * that says `C.gold` gets black, and `C.cream` gets the light grey surface.
 * That was deliberate: 20 templates each declared their own copy of the
 * palette, and repointing the tokens re-skins all of them without anyone
 * having to re-lay-out a single table.
 *
 * Two body-text roles, deliberately different — this is not an oversight:
 *
 *   `text` is for BRANDED emails (the gallery unlock, the newsletter, alerts).
 *          Grey, sitting inside a designed layout.
 *   `ink`  is for NOTE-STYLE emails (the follow-up, the auto-reply). Near-black,
 *          because those are signed by Dylan and should read like something a
 *          person typed, not like a publication.
 *
 * And a third register has no tokens at all: an actual reply draft. See
 * `design.bare` in templateStore.js — a personal reply carries no styling,
 * so Gmail renders it exactly as if Dylan had typed it.
 */

export const BRAND = {
  // ---- Core palette -------------------------------------------------------
  black:   '#111111',   // headings, buttons, links, rules
  ink:     '#111111',   // body copy — note-style emails
  text:    '#3d3d3d',   // body copy — branded emails
  soft:    '#5c5c5c',   // secondary body copy
  muted:   '#6b6b6b',   // eyebrows, captions, meta
  label:   '#8a8a8a',   // small uppercase field labels
  surface: '#f5f5f5',   // section backgrounds
  paper:   '#ffffff',   // email background
  white:   '#ffffff',
  card:    '#ffffff',
  border:  '#e6e6e6',   // card borders
  rule:    '#ededed',   // hairlines between rows
  line:    '#e6e6e6',

  // On a black panel, text cannot be black. Use these there.
  onDark:      '#ffffff',
  onDarkMuted: '#b3b3b3',

  // ---- Legacy names, repointed -------------------------------------------
  // Kept so the existing templates keep compiling. New work should use the
  // names above; these exist so the re-skin was one commit, not twenty.
  navy:    '#111111',
  navy60:  '#6b6b6b',
  gold:    '#111111',
  goldD:   '#000000',
  cream:   '#f5f5f5',

  // ---- Type ---------------------------------------------------------------
  // The site is Poppins for headings, Inter for body. Gmail strips webfonts,
  // so every stack ends in Helvetica/Arial and is designed to look right
  // there — the character comes from the layout and the spacing, not the
  // fonts. Apple Mail and iOS Mail will honour the webfont if a template
  // links it; nothing depends on that happening.
  head:      "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  body:      "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  sans:      "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  sansTight: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  // `serif` is no longer a serif. The redesign has none, and leaving the key
  // pointed at Georgia would have quietly kept Georgia in a dozen headings.
  serif:      "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  serifTight: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",

  // Webfont link for the clients that honour one. Optional everywhere.
  webfontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Inter:wght@400;500;600&display=swap',

  // ---- Rhythm -------------------------------------------------------------
  paragraphGap: '20px',
  shellPadding: '36px 32px 40px',
  containerWidth: 600,
};

export default BRAND;
