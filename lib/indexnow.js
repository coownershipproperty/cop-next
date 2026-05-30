// IndexNow — instantly notify Bing / Microsoft Copilot (and Yandex) when URLs
// are published or updated, so they recrawl within minutes instead of waiting
// for the next organic crawl. Bing powers Copilot, and AI Performance shows COP
// already earns ~2k Copilot citations/quarter, so fast recrawl compounds there.
//
// The key is PUBLIC by design — it is served as a plain-text file at
// https://co-ownership-property.com/<KEY>.txt and IndexNow fetches it to verify
// ownership. Keep public/<KEY>.txt in sync with INDEXNOW_KEY below.
// Docs: https://www.indexnow.org

const INDEXNOW_KEY = '8f3c1e7a9b2d4f60a5c8e1b3d6f09a2c';
const HOST = 'co-ownership-property.com';
const SITE = `https://${HOST}`;

/**
 * Submit a batch of changed paths to IndexNow. Best-effort: never throws, so an
 * IndexNow outage can't break revalidation or content publishing.
 * @param {string[]} paths - app-relative paths, e.g. ['/blog/foo/', '/our-homes/']
 */
export async function pingIndexNow(paths) {
  try {
    const urlList = [...new Set(
      (paths || [])
        .filter(p => typeof p === 'string' && p.startsWith('/'))
        .map(p => `${SITE}${p.endsWith('/') ? p : p + '/'}`)
    )];
    if (urlList.length === 0) return;

    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch (err) {
    console.error('IndexNow ping failed:', err.message);
  }
}
