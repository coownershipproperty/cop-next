/**
 * The model client for the AI property search.
 *
 * Deliberately thin, and deliberately provider-agnostic. Everything speaks the
 * OpenAI chat-completions shape, which is also what Moonshot (Kimi), Together,
 * Groq, DeepSeek, OpenRouter and most others expose. Swapping provider is two
 * environment variables and no code change:
 *
 *   OPENAI_API_KEY   the key
 *   SEARCH_MODEL     e.g. gpt-5.6-luna
 *   OPENAI_BASE_URL  optional; e.g. https://api.moonshot.ai/v1
 *
 * That matters commercially. At ~2,000 input and ~370 output tokens a search,
 * the same code costs about $0.84 per thousand searches on Luna and about
 * $2.30 on Kimi K2.5. If either moves, we move, without a deploy-shaped
 * argument about it.
 *
 * The one hard rule: this file never decides anything. It fetches text. All
 * ranking lives in rank.js, offline and testable, so a model outage degrades
 * the search rather than breaking it.
 */

const DEFAULT_BASE = 'https://api.openai.com/v1';
const TIMEOUT_MS = 20000;

export function modelName() {
  return process.env.SEARCH_MODEL || 'gpt-5.6-luna';
}

/** Whether a live model is configured at all. The search must work without one. */
export function hasModel() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function baseUrl() {
  return (process.env.OPENAI_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

/**
 * Models disagree about the name of the output-length parameter and about
 * whether they will accept a temperature at all. Rather than pin the code to
 * one vendor's current opinion, we send the common form, read the complaint,
 * drop the offending parameter and retry once. Costs one wasted round trip on
 * an unfamiliar model and nothing thereafter.
 */
function adaptBody(body, errText) {
  const e = String(errText || '').toLowerCase();
  const next = { ...body };
  let changed = false;

  if (e.includes('max_tokens') && e.includes('max_completion_tokens') && next.max_tokens != null) {
    next.max_completion_tokens = next.max_tokens;
    delete next.max_tokens;
    changed = true;
  }
  if (e.includes('temperature') && next.temperature != null) {
    delete next.temperature;
    changed = true;
  }
  if (e.includes('response_format') && next.response_format) {
    delete next.response_format;
    changed = true;
  }
  return changed ? next : null;
}

/**
 * One chat completion. Returns the assistant's text, or throws with a message
 * that names the actual failure — a 401 says "key", a 429 says "credit" — so a
 * misconfiguration is diagnosable from the response instead of appearing as a
 * mysteriously empty search.
 */
export async function chat(messages, opts = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('NO_MODEL_CONFIGURED');

  let body = {
    model: modelName(),
    messages,
    temperature: opts.temperature ?? 0,
    max_tokens: opts.maxTokens ?? 700,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  };

  const maxAttempts = opts.attempts ?? 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res, text;
    try {
      res = await fetch(`${baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        // Callers set this per call: a failed "understand" has a decent free
        // fallback so it gets a short leash; the buyer should never sit
        // watching a spinner while a retry loop burns twenty seconds.
        signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
      });
      text = await res.text();
    } catch (err) {
      if (attempt < maxAttempts - 1) { await new Promise(r => setTimeout(r, 600 * (attempt + 1))); continue; }
      throw new Error(`MODEL_UNREACHABLE: ${err.name}`);
    }

    if (res.ok) {
      let json;
      try { json = JSON.parse(text); } catch { throw new Error('MODEL_BAD_RESPONSE'); }
      const out = json?.choices?.[0]?.message?.content;
      if (typeof out !== 'string') throw new Error('MODEL_EMPTY_RESPONSE');
      return { text: out, usage: json.usage || null };
    }

    // A parameter the provider does not accept: adapt and retry immediately.
    if (res.status === 400) {
      const adapted = adaptBody(body, text);
      if (adapted) { body = adapted; continue; }
    }
    if (res.status === 401) throw new Error('MODEL_AUTH_FAILED: check OPENAI_API_KEY');
    if (res.status === 429) {
      // Rate limit or, far more often on a new account, no billing credit.
      if (attempt < maxAttempts - 1) { await new Promise(r => setTimeout(r, 900 * (attempt + 1))); continue; }
      throw new Error('MODEL_RATE_LIMITED: rate limit, or the account has no credit');
    }
    if (res.status >= 500 && attempt < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
      continue;
    }
    throw new Error(`MODEL_HTTP_${res.status}: ${String(text).slice(0, 160)}`);
  }
  throw new Error('MODEL_RETRIES_EXHAUSTED');
}

/**
 * Models fence JSON in markdown when they feel like it, and occasionally add a
 * sentence of commentary either side. Recover the object rather than failing
 * the whole search over punctuation.
 */
export function parseJsonLoose(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return null;
}

/** Convenience: a chat call that is expected to return an object. */
export async function chatJson(messages, opts = {}) {
  const { text, usage } = await chat(messages, { ...opts, json: true });
  const obj = parseJsonLoose(text);
  if (!obj) throw new Error('MODEL_BAD_JSON');
  return { obj, usage };
}
