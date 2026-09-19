#!/usr/bin/env node
/*
 * Build guard: the mobile drawer must never be trapped inside the header.
 *
 * components/Header.js renders the drawer (.cop-nav) and its overlay as
 * children of .cop-header. On phones the drawer is position:fixed and
 * expects the *viewport* as its containing block. CSS says that any of
 * these properties on an ancestor hijack that and make the ancestor the
 * containing block instead:
 *
 *   transform, filter, backdrop-filter, perspective, will-change (of those),
 *   contain: layout|paint|strict|content, container-type
 *
 * On 18 Sep 2026 a `-webkit-backdrop-filter: blur(12px)` on .cop-header
 * (there since 15 Apr 2026) did exactly that in WebKit: every iPhone
 * browser opened the menu as an 80px strip showing only "HOME". Chrome
 * ignores the -webkit- prefix, so nobody on a desktop saw it.
 *
 * This script parses styles/globals.css and fails the build if any rule
 * whose subject is .cop-header (or html / body / #__next, its ancestors)
 * sets one of those properties, at any breakpoint. It also fails if the
 * drawer stops being position:fixed, or if the drawer moves out from under
 * the header in the JSX without this file being updated.
 *
 * Runs automatically as `prebuild` (so Vercel refuses to deploy it) and
 * can be run by hand:  node scripts/check-header-css.js
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

const ROOT = path.join(__dirname, '..');
const CSS = path.join(ROOT, 'styles', 'globals.css');
const HEADER_JS = path.join(ROOT, 'components', 'Header.js');

// Elements that are ancestors of the fixed drawer. Anything that styles
// one of these must not create a containing block.
const ANCESTOR_SUBJECTS = new Set(['.cop-header', 'html', 'body', '#__next']);

const BAD = {
  'transform': (v) => v !== 'none',
  'filter': (v) => v !== 'none',
  'backdrop-filter': (v) => v !== 'none',
  '-webkit-backdrop-filter': (v) => v !== 'none',
  'perspective': (v) => v !== 'none',
  'will-change': (v) => /transform|filter|perspective|contain/.test(v),
  'contain': (v) => /layout|paint|strict|content/.test(v),
  'container-type': (v) => v !== 'normal',
};

function subjectsOf(selector) {
  // Return the "subject" compound of each selector in the list, e.g.
  // ".cop-header.scrolled" → ".cop-header", ".cop-header .cop-logo" → ".cop-logo"
  const out = [];
  try {
    selectorParser((root) => {
      root.each((sel) => {
        const nodes = sel.nodes;
        // last compound = nodes after the final combinator
        let start = 0;
        nodes.forEach((n, i) => { if (n.type === 'combinator') start = i + 1; });
        const compound = nodes.slice(start);
        for (const n of compound) {
          if (n.type === 'class') out.push('.' + n.value);
          if (n.type === 'id') out.push('#' + n.value);
          if (n.type === 'tag') out.push(n.value.toLowerCase());
        }
      });
    }).processSync(selector);
  } catch (e) { /* unparsable selector: ignore */ }
  return out;
}

function mediaOf(node) {
  const parts = [];
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule') parts.unshift(`@${p.name} ${p.params}`);
  }
  return parts.join(' > ') || '(root)';
}

const css = fs.readFileSync(CSS, 'utf8');
const root = postcss.parse(css, { from: CSS });
const problems = [];
let drawerFixed = false;

root.walkRules((rule) => {
  const subjects = subjectsOf(rule.selector);
  const hitsAncestor = subjects.some((s) => ANCESTOR_SUBJECTS.has(s));
  const isDrawer = subjects.includes('.cop-nav');
  rule.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const value = decl.value.trim().toLowerCase();
    if (hitsAncestor && BAD[prop] && BAD[prop](value)) {
      problems.push(`${CSS}:${decl.source.start.line}  ${mediaOf(rule)}  ${rule.selector.replace(/\s+/g, ' ')} { ${prop}: ${decl.value} }`);
    }
    if (isDrawer && prop === 'position' && value === 'fixed') drawerFixed = true;
  });
});

if (!drawerFixed) {
  problems.push(`.cop-nav is no longer position:fixed anywhere in ${CSS} — the drawer guard no longer knows what it is protecting; update this script.`);
}

// Structural assumption: the drawer still lives inside the header in JSX.
const jsx = fs.readFileSync(HEADER_JS, 'utf8');
const headerOpen = jsx.indexOf('<header');
const headerClose = jsx.indexOf('</header>');
const navIdx = jsx.indexOf('id="cop-nav"');
if (headerOpen < 0 || headerClose < 0 || navIdx < 0 || navIdx < headerOpen || navIdx > headerClose) {
  console.warn('check-header-css: #cop-nav is not inside <header> in components/Header.js any more — the header-ancestor rule may be obsolete; review ANCESTOR_SUBJECTS.');
}

if (problems.length) {
  console.error('\n✖ Mobile drawer would be trapped inside the header (see scripts/check-header-css.js):\n');
  for (const p of problems) console.error('  ' + p);
  console.error('\n  Any of transform / filter / backdrop-filter / perspective / will-change / contain on .cop-header (or html, body, #__next)\n  makes it the containing block of the position:fixed drawer. On iPhone the menu then shows one link. Remove it.\n');
  process.exit(1);
}
console.log('✔ check-header-css: no containing-block properties on the drawer\'s ancestors; drawer is position:fixed.');
