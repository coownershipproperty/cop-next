const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

function env(name) {
  return (process.env[name] || '').trim();
}

function requireEnv(name) {
  const value = env(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function telnyxRequest(path, init = {}) {
  const apiKey = requireEnv('TELNYX_API_KEY');
  const response = await fetch(`${TELNYX_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Telnyx API failed (${response.status}): ${body || response.statusText}`);
  }
  return body;
}

function readJsonObject(body) {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function readToken(body) {
  const json = readJsonObject(body);
  const data = json?.data;

  if (data && typeof data === 'object') {
    const token = data.token || data.jwt || data.login_token;
    if (typeof token === 'string' && token.trim()) return token.trim();
  }

  const token = json?.token || json?.jwt || json?.login_token;
  if (typeof token === 'string' && token.trim()) return token.trim();

  return body.trim().replace(/^"|"$/g, '');
}

function readCredentialId(body) {
  const json = readJsonObject(body);
  const data = json?.data;

  if (data && typeof data === 'object' && typeof data.id === 'string' && data.id.trim()) {
    return data.id.trim();
  }

  if (typeof json?.id === 'string' && json.id.trim()) return json.id.trim();

  throw new Error('Telnyx did not return a telephony credential id.');
}

function temporaryCredentialExpiresAt() {
  const ttlHours = Number(env('TELNYX_TEMP_CREDENTIAL_TTL_HOURS') || '24');
  const safeTtlHours = Number.isFinite(ttlHours) && ttlHours > 0 ? Math.min(ttlHours, 168) : 24;
  return new Date(Date.now() + safeTtlHours * 60 * 60 * 1000).toISOString();
}

async function createTemporaryTelephonyCredential() {
  const connectionId = requireEnv('TELNYX_CONNECTION_ID');
  const expiresAt = temporaryCredentialExpiresAt();
  const body = await telnyxRequest('/telephony_credentials', {
    method: 'POST',
    body: JSON.stringify({
      connection_id: connectionId,
      expires_at: expiresAt,
      name: `cop-crm-${Date.now()}`,
      tag: 'cop-crm',
    }),
  });

  return { id: readCredentialId(body), expiresAt };
}

async function createJwtForCredential(credentialId) {
  const body = await telnyxRequest(`/telephony_credentials/${credentialId}/token`, {
    method: 'POST',
  });
  const token = readToken(body);
  if (!token) throw new Error('Telnyx did not return a usable WebRTC token.');
  return token;
}

export async function getTelnyxBrowserCredential() {
  const callerId = requireEnv('TELNYX_CALLER_ID');
  const apiKey = env('TELNYX_API_KEY');

  if (apiKey) {
    const configuredCredentialId = env('TELNYX_TELEPHONY_CREDENTIAL_ID');
    const credential = configuredCredentialId
      ? { id: configuredCredentialId, expiresAt: undefined }
      : await createTemporaryTelephonyCredential();

    return {
      callerId,
      auth: {
        type: 'token',
        loginToken: await createJwtForCredential(credential.id),
        credentialId: credential.id,
        expiresAt: credential.expiresAt,
      },
    };
  }

  if (env('TELNYX_ENABLE_BROWSER_SIP_CREDENTIALS') === 'true') {
    return {
      callerId,
      auth: {
        type: 'credentials',
        login: requireEnv('TELNYX_SIP_USERNAME'),
        password: requireEnv('TELNYX_SIP_PASSWORD'),
      },
    };
  }

  throw new Error(
    'Set TELNYX_API_KEY and TELNYX_CONNECTION_ID, or explicitly enable TELNYX_ENABLE_BROWSER_SIP_CREDENTIALS for local testing.',
  );
}
