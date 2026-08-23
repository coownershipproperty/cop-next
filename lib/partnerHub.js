export const PARTNER_HUB_STAGES = [
  'New',
  'Contacted',
  'Viewing',
  'Contract signed',
  'Deposit paid',
  'Won',
  'Lost',
  'Paused',
];

export function cleanPartnerHubText(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}
export function isPartnerHubEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function partnerHubInitials(firstName, lastName) {
  return `${String(firstName || '').charAt(0)}${String(lastName || '').charAt(0)}`.toUpperCase();
}

export function partnerHubAge(iso) {
  const timestamp = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function serialisePartnerHubPartner(row) {
  return {
    id: row.id,
    name: row.display_name,
    firstName: row.notification_name?.split(/\s+/)[0] || 'Partner',
    lastName: row.notification_name?.split(/\s+/).slice(1).join(' ') || 'contact',
    notificationName: row.notification_name || '',
    email: row.notification_email || '',
    phone: row.notification_phone || '',
    testRouting: row.test_routing,
    active: row.active,
  };
}

export function serialisePartnerHubLead(row, partnerName) {
  return {
    id: row.id,
    partnerId: row.partner_id,
    partner: partnerName || row.partner_id,
    initials: partnerHubInitials(row.first_name, row.last_name),
    name: `${row.first_name} ${row.last_name}`.trim(),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || '',
    nationality: row.nationality || '',
    collection: row.collection_type || '—',
    location: row.destination || '—',
    stage: row.status,
    age: partnerHubAge(row.updated_at),
    budget: row.budget_display || 'Not specified',
    note: row.preferences || 'No additional context supplied.',
    isTest: row.is_test,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
