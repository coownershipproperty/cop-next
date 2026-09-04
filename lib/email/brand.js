/**
 * lib/email/brand.js — the one place COP's email design is defined.
 *
 * Before this file the brand navy was hardcoded in 48 files: every email
 * template declared its own `const C = { navy, gold, cream… }`, so they matched
 * only because someone typed the same hex twice. Nothing enforced it, and
 * nothing warned when it drifted.
 *
 * Two body-text roles, deliberately different — this is not an oversight:
 *
 *   `text` is for BRANDED emails (the gallery unlock, the newsletter, alerts).
 *          A blue-grey that sits inside a designed layout.
 *   `ink`  is for NOTE-STYLE emails (the follow-up, the auto-reply). Near-black,
 *          because those are signed by Dylan and should read like something a
 *          person typed, not like a publication.
 *
 * And a third register has no tokens at all: an actual reply draft. See
 * `design.bare` in templateStore.js — a personal reply carries no styling,
 * so Gmail renders it exactly as if Dylan had typed it.
 */

export const BRAND = {
  // Palette
  navy:    '#1E3448',   // headings, links
  navy60:  '#6B8A9E',   // eyebrows, secondary text
  gold:    '#C9A84C',   // accent, buttons, the one warm colour
  cream:   '#F7F4EE',   // section backgrounds
  paper:   '#ffffff',   // email background
  border:  '#E8E3DC',   // card borders
  rule:    '#EFEAE2',   // hairlines between rows
  label:   '#9BAAB6',   // small uppercase field labels
  text:    '#3A5168',   // body copy — branded emails
  ink:     '#2a2a2a',   // body copy — note-style emails

  // Type. Email clients only reliably render web-safe stacks, so these are
  // deliberately boring — the character comes from the layout, not the fonts.
  serif:     "Georgia,'Times New Roman',serif",
  serifTight:'Georgia,serif',
  sans:      'Arial,Helvetica,sans-serif',
  sansTight: 'Arial,sans-serif',

  // Rhythm
  paragraphGap: '20px',
  shellPadding: '36px 32px 40px',
};

export default BRAND;
