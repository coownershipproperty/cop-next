/**
 * Acceptance test for the {{UNSUB_URL}} placeholder added to lib/unsub.js.
 *
 * Run:  cd /home/claude/cop-next && CRON_SECRET=test-secret node test-unsub-placeholder.mjs
 *
 * What matters here is not that the substitution works in the happy case, but
 * the three ways it could quietly go wrong on a 399-recipient send:
 *   1. leaving a raw {{UNSUB_URL}} in the body (recipient sees the literal text)
 *   2. substituting only the first of several occurrences
 *   3. mutating html that has nothing to do with this mechanism
 */
import { UNSUB_PLACEHOLDER, resolveUnsubPlaceholder, unsubUrl, verifyUnsubToken } from './lib/unsub.js';

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) { console.log(`  ok   ${name}`); }
  else { console.log(`  FAIL ${name}${extra ? ' — ' + extra : ''}`); failures++; }
}

const EMAIL = 'Someone.Example@Gmail.com';

// 1. Single occurrence is replaced with a real, verifying URL.
const one = resolveUnsubPlaceholder(`<p>bye</p><a href="${UNSUB_PLACEHOLDER}">Unsubscribe</a>`, EMAIL);
check('placeholder is gone', !one.includes(UNSUB_PLACEHOLDER), one);
check('real URL is present', one.includes('https://co-ownership-property.com/unsubscribe/?e='));

// The token in the produced URL must be the one /api/unsubscribe accepts.
const url = new URL(unsubUrl(EMAIL));
const e = url.searchParams.get('e');
const tok = url.searchParams.get('t');
check('address is normalised in the link', e === 'someone.example@gmail.com', e);
check('token verifies', verifyUnsubToken(EMAIL, tok) === true);
check('token is rejected for a different address', verifyUnsubToken('other@gmail.com', tok) === false);
check('link built for the recipient appears verbatim in the html', one.includes(unsubUrl(EMAIL)));

// 2. EVERY occurrence is replaced — String.replace() with a string pattern would
//    have swapped only the first and shipped a literal {{UNSUB_URL}} in the footer.
const two = resolveUnsubPlaceholder(
  `<a href="${UNSUB_PLACEHOLDER}">a</a> ... <a href="${UNSUB_PLACEHOLDER}">b</a>`, EMAIL);
check('no placeholder survives when there are two', !two.includes(UNSUB_PLACEHOLDER), two);
check('both became the real URL', two.split(unsubUrl(EMAIL)).length === 3);

// 3. Untouched for everything queueEmail() produces — the overwhelmingly common case.
const plain = '<p>Hello</p><a href="https://co-ownership-property.com/unsubscribe/?e=x&t=y">Unsubscribe</a>';
check('html without the placeholder is returned byte-identical', resolveUnsubPlaceholder(plain, EMAIL) === plain);

// 4. Degenerate inputs must not throw — a null html in the queue should not take
//    down a whole batch of 100.
check('null html does not throw', resolveUnsubPlaceholder(null, EMAIL) === '');
check('undefined html does not throw', resolveUnsubPlaceholder(undefined, EMAIL) === '');

console.log(failures === 0 ? '\nPASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
