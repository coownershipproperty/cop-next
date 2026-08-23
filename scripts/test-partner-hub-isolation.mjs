import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.PARTNER_HUB_TEST_BASE_URL || '';

if (!url || !anonKey || !serviceKey) {
  throw new Error('Partner Hub isolation test requires the Supabase URL, anon key and service role key.');
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const password = crypto.randomBytes(24).toString('base64url');
const identities = [
  { partnerId: 'Vivla', email: `partner-hub-vivla-${suffix}@example.com` },
  { partnerId: '21-5', email: `partner-hub-21-5-${suffix}@example.com` },
];
const createdUsers = [];
const createdLeads = [];

function browserClient() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function api(token, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

try {
  for (const identity of identities) {
    const { data, error } = await admin.auth.admin.createUser({
      email: identity.email,
      password,
      email_confirm: true,
      user_metadata: { automated_partner_hub_isolation_test: true },
    });
    assert.ifError(error);
    assert.ok(data.user?.id);
    identity.userId = data.user.id;
    createdUsers.push(data.user.id);
  }

  const { error: membershipError } = await admin.from('partner_hub_memberships').insert(
    identities.map((identity) => ({ partner_id: identity.partnerId, user_id: identity.userId, active: true }))
  );
  assert.ifError(membershipError);

  const { error: duplicateMembershipError } = await admin.from('partner_hub_memberships').insert({
    partner_id: '21-5',
    user_id: identities[0].userId,
    active: true,
  });
  assert.ok(duplicateMembershipError, 'One login must not be assignable to two partners');

  const { data: leads, error: leadError } = await admin.from('partner_hub_leads').insert(
    identities.map((identity) => ({
      source_ref: `automated-isolation-${identity.partnerId}-${suffix}`,
      partner_id: identity.partnerId,
      first_name: 'Automated',
      last_name: identity.partnerId,
      email: identity.email,
      destination: 'Isolation test',
      preferences: 'Disposable automated cross-tenant isolation test.',
      consent_confirmed_at: new Date().toISOString(),
      created_by_email: 'automated-isolation-test',
      is_test: true,
    }))
  ).select('*');
  assert.ifError(leadError);
  assert.equal(leads.length, 2);
  createdLeads.push(...leads.map((lead) => lead.id));

  const sessions = new Map();
  for (const identity of identities) {
    const client = browserClient();
    const { data, error } = await client.auth.signInWithPassword({ email: identity.email, password });
    assert.ifError(error);
    assert.ok(data.session?.access_token);
    sessions.set(identity.partnerId, { client, token: data.session.access_token });
  }

  for (const identity of identities) {
    const ownLead = leads.find((lead) => lead.partner_id === identity.partnerId);
    const otherLead = leads.find((lead) => lead.partner_id !== identity.partnerId);
    const { client } = sessions.get(identity.partnerId);

    const { data: organisations, error: organisationError } = await client.from('partner_hub_partners').select('id');
    assert.ifError(organisationError);
    assert.deepEqual(organisations.map((row) => row.id), [identity.partnerId]);

    const { data: visible, error: visibleError } = await client.from('partner_hub_leads').select('id, partner_id');
    assert.ifError(visibleError);
    assert.ok(visible.some((row) => row.id === ownLead.id));
    assert.ok(visible.every((row) => row.partner_id === identity.partnerId));

    const { data: forbidden, error: forbiddenError } = await client.from('partner_hub_leads').select('id').eq('id', otherLead.id);
    assert.ifError(forbiddenError);
    assert.equal(forbidden.length, 0);

    const { error: directUpdateError } = await client.from('partner_hub_leads').update({ status: 'Won' }).eq('id', ownLead.id);
    assert.ok(directUpdateError, 'Browser clients must not have direct UPDATE privileges');

    const { data: notificationRows, error: notificationError } = await client.from('partner_hub_notifications').select('id');
    assert.ifError(notificationError);
    assert.equal(notificationRows.length, 0, 'Partner users must not read notification recipient logs');
  }

  if (baseUrl) {
    const vivla = identities.find((identity) => identity.partnerId === 'Vivla');
    const vivlaLead = leads.find((lead) => lead.partner_id === 'Vivla');
    const otherLead = leads.find((lead) => lead.partner_id === '21-5');
    const { token } = sessions.get('Vivla');

    const list = await api(token, '/api/partner-hub/leads');
    assert.equal(list.response.status, 200);
    assert.ok(list.payload.leads.every((lead) => lead.partnerId === vivla.partnerId));

    const guessed = await api(token, `/api/partner-hub/leads/${otherLead.id}`);
    assert.equal(guessed.response.status, 404, 'Cross-partner API lead lookup must be indistinguishable from missing data');

    const updated = await api(token, `/api/partner-hub/leads/${vivlaLead.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'stage', stage: 'Contacted', note: 'Automated API persistence test.' }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.lead.stage, 'Contacted');

    const { data: persisted, error: persistedError } = await admin.from('partner_hub_leads').select('status').eq('id', vivlaLead.id).single();
    assert.ifError(persistedError);
    assert.equal(persisted.status, 'Contacted');
  }

  console.log(JSON.stringify({
    ok: true,
    rls: 'each test user saw exactly one partner organisation and only that partner\'s leads',
    directWrites: 'denied',
    duplicateMembership: 'denied',
    apiIsolation: baseUrl ? 'passed' : 'not requested',
    apiPersistence: baseUrl ? 'passed with email delivery disabled' : 'not requested',
  }, null, 2));
} finally {
  if (createdLeads.length) await admin.from('partner_hub_leads').delete().in('id', createdLeads);
  for (const userId of createdUsers) await admin.auth.admin.deleteUser(userId);
}
