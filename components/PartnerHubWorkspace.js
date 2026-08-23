import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { PARTNER_HUB_STAGES } from '@/lib/partnerHub';
import {
  EUROPE_DIAL_CODES,
  EUROPE_COUNTRIES,
  INTERNATIONAL_DIAL_CODES,
  INTERNATIONAL_COUNTRIES,
  joinInternationalPhone,
  splitInternationalPhone,
} from '@/lib/internationalDialCodes';

const EMPTY_LEAD = {
  partnerId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  phoneDialCode: '+44',
  nationality: '',
  destination: '',
  collectionType: '',
  budget: '',
  preferences: '',
  consentConfirmed: false,
  notifyPartner: true,
  isTest: true,
};

const PARTNER_HUB_BUDGET_RANGES = [
  '€50,000–€100,000',
  '€100,000–€200,000',
  '€200,000–€350,000',
  '€350,000–€500,000',
  '€500,000–€750,000',
  '€750,000–€1,000,000',
  '€1,000,000+',
];

function BudgetSelect({ value, onChange, id, required = false }) {
  const customValue = value && !PARTNER_HUB_BUDGET_RANGES.includes(value);
  return (
    <select id={id} value={value} required={required} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select approximate budget</option>
      {customValue && <option value={value}>{value} (existing value)</option>}
      {PARTNER_HUB_BUDGET_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
    </select>
  );
}

function SearchableCountryInput({ value, onChange, id, options, ariaLabel, className = '' }) {
  const selectedLabel = options.find((option) => option.value === value)?.label || value || '';

  function matchOption(rawValue) {
    const normalized = rawValue.trim().toLocaleLowerCase();
    return options.find((option) => option.label.toLocaleLowerCase() === normalized || option.value.toLocaleLowerCase() === normalized);
  }

  function finishSearch(event) {
    const input = event.currentTarget;
    if (!input.value.trim()) {
      onChange('');
      input.value = '';
      return;
    }
    const match = matchOption(input.value);
    if (match) {
      onChange(match.value);
      input.value = match.label;
    } else {
      input.value = selectedLabel;
    }
  }

  return (
    <>
      <input
        key={selectedLabel || 'empty'}
        id={id}
        className={className}
        type="search"
        list={`${id}-options`}
        defaultValue={selectedLabel}
        autoComplete="off"
        spellCheck="false"
        aria-label={ariaLabel}
        placeholder="Type a country or first letter…"
        onFocus={(event) => event.currentTarget.select()}
        onInput={(event) => {
          const match = matchOption(event.currentTarget.value);
          if (match) onChange(match.value);
        }}
        onBlur={finishSearch}
      />
      <datalist id={`${id}-options`}>
        {options.map((option) => <option key={`${option.label}-${option.value}`} value={option.label}>{option.value !== option.label ? option.value : ''}</option>)}
      </datalist>
    </>
  );
}

function DialCodeSelect({ value, onChange, id }) {
  const options = [...EUROPE_DIAL_CODES, ...INTERNATIONAL_DIAL_CODES].map(([country, code]) => ({ label: `${country} ${code}`, value: code }));
  return <SearchableCountryInput id={id} className="dial-code-search" value={value} onChange={onChange} options={options} ariaLabel="Search international dialling code" />;
}

function NationalitySelect({ value, onChange, id }) {
  const known = EUROPE_COUNTRIES.includes(value) || INTERNATIONAL_COUNTRIES.includes(value);
  const countries = [...EUROPE_COUNTRIES, ...INTERNATIONAL_COUNTRIES];
  const options = countries.map((country) => ({ label: country, value: country }));
  if (value && !known) options.unshift({ label: value, value });
  return <SearchableCountryInput id={id} value={value} onChange={onChange} options={options} ariaLabel="Search nationality" />;
}

function DestinationMultiSelect({ value, onChange, destinations, id }) {
  const [query, setQuery] = useState('');
  const selectedValues = useMemo(() => String(value || '').split(',').map((region) => region.trim()).filter(Boolean), [value]);
  const knownRegions = useMemo(() => new Set(destinations.flatMap((group) => group.regions)), [destinations]);
  const unknownValues = selectedValues.filter((region) => !knownRegions.has(region));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredDestinations = destinations
    .map((group) => ({
      ...group,
      regions: group.regions.filter((region) => !normalizedQuery || group.country.toLocaleLowerCase().includes(normalizedQuery) || region.toLocaleLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.regions.length);

  function toggle(region) {
    const next = selectedValues.includes(region)
      ? selectedValues.filter((selected) => selected !== region)
      : [...selectedValues, region];
    onChange(next.join(', '));
  }

  return (
    <details className="destination-multi" id={id}>
      <summary>
        <span>{selectedValues.length ? selectedValues.join(', ') : 'Select one or more destinations'}</span>
        <b>{selectedValues.length || '＋'}</b>
      </summary>
      <div className="destination-multi-panel">
        <input
          className="destination-multi-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search destinations…"
          aria-label="Search destinations"
          autoComplete="off"
        />
        <div className="destination-multi-groups">
          {unknownValues.length > 0 && <section className="destination-multi-group">
            <h4>Existing selections</h4>
            <div className="destination-multi-options">
              {unknownValues.map((region) => <button className="destination-multi-option selected" type="button" key={`existing-${region}`} onClick={() => toggle(region)} aria-pressed="true"><span>{region}</span><b>✓</b></button>)}
            </div>
          </section>}
          {filteredDestinations.map((group) => <section className="destination-multi-group" key={group.country}>
            <h4>{group.country}</h4>
            <div className="destination-multi-options">
              {group.regions.map((region) => {
                const selected = selectedValues.includes(region);
                return <button className={`destination-multi-option${selected ? ' selected' : ''}`} type="button" key={`${group.country}-${region}`} onClick={() => toggle(region)} aria-pressed={selected}><span>{region}</span><b>{selected ? '✓' : '+'}</b></button>;
              })}
            </div>
          </section>)}
          {filteredDestinations.length === 0 && <p className="destination-multi-empty">No matching destination.</p>}
        </div>
      </div>
    </details>
  );
}

function stageClass(stage) {
  return String(stage || 'new').toLowerCase().replaceAll(' ', '-');
}

function formatEvent(event) {
  if (event.event_type === 'stage_changed') {
    return `Stage changed from ${event.from_stage || '—'} to ${event.to_stage || '—'}`;
  }
  if (event.event_type === 'lead_created') return 'Lead shared by COP';
  if (event.event_type === 'lead_viewed') return 'Partner opened the lead';
  if (event.event_type === 'help_requested') return 'Partner requested help from COP';
  if (event.event_type === 'shortlist_updated') {
    return `${event.metadata?.operation === 'remove' ? 'Removed' : 'Added'} ${event.metadata?.property_title || 'a property'} ${event.metadata?.operation === 'remove' ? 'from' : 'to'} the shortlist`;
  }
  if (event.event_type === 'note_added') return 'Progress note added';
  if (event.event_type === 'lead_updated') return 'Lead details updated by COP';
  if (event.event_type === 'notification_sent') return 'Email notification sent';
  if (event.event_type === 'notification_failed') return 'Email notification failed';
  return String(event.event_type || 'Activity').replaceAll('_', ' ');
}

function formatMoment(value) {
  if (!value) return 'Not yet';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPropertyPrice(price, currency = 'EUR') {
  if (!price) return 'Price on listing';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(price));
  } catch {
    return `${currency} ${price}`;
  }
}

async function hubRequest(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const error = new Error('Your secure session has expired. Please sign in again.');
    error.status = 401;
    throw error;
  }
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'The Partner Hub request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function Brand() {
  return (
    <div className="brand" aria-label="Co-Ownership Partner Hub">
      <span className="brand-mark">C</span>
      <span><strong>CO-OWNERSHIP</strong><small>PARTNER HUB</small></span>
    </div>
  );
}

function Sidebar({ role, view, setView, leadCount, partner, previewPartner, onPreviewEnd, email, onSignOut }) {
  const admin = role === 'admin';
  const item = (id, icon, label, count) => (
    <button type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}>
      <span aria-hidden="true">{icon}</span>{label}{count !== undefined && <b>{count}</b>}
    </button>
  );

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="main-nav" aria-label="Partner Hub">
        {admin && item('overview', '⌂', 'Overview')}
        {item('leads', '▥', admin ? 'Leads' : 'My leads', leadCount)}
        {admin && item('submit', '+', 'Submit lead')}
        {admin && item('access', '◎', 'Partner access')}
      </nav>
      <div className="sidebar-spacer" />
      {previewPartner ? (
        <div className="security-note">
          <span>✓</span>
          <div><strong>Scoped preview: {previewPartner.name}</strong><small>Only this partner&apos;s leads are shown. Editing is disabled.</small></div>
        </div>
      ) : (
        <div className="security-note">
          <span>✓</span>
          <div>
            <strong>{admin ? 'Administrator access' : `${partner?.name || 'Partner'} workspace`}</strong>
            <small>{admin ? 'Full network visibility, verified server-side.' : 'Your login is restricted to one partner account.'}</small>
          </div>
        </div>
      )}
      {previewPartner && <button className="preview-exit" type="button" onClick={onPreviewEnd}>Exit partner preview</button>}
      <button className="profile-card" type="button" onClick={onSignOut} title="Sign out">
        <span className="avatar">{admin ? 'DO' : (partner?.name || 'P').slice(0, 2).toUpperCase()}</span>
        <span><strong>{email}</strong><small>{admin ? 'Administrator' : partner?.name}</small></span>
        <span className="logout-label">Sign out</span>
      </button>
    </aside>
  );
}

function Topbar({ role, title, setView, previewPartner }) {
  return (
    <header className="topbar">
      <div>
        <p className="ph-eyebrow">{previewPartner ? `${previewPartner.name} · READ-ONLY PARTNER PREVIEW` : role === 'admin' ? 'PRIVATE ADMIN WORKSPACE' : 'PRIVATE PARTNER WORKSPACE'}</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <span className={`access-chip ${role}`}>{role === 'admin' ? 'ADMIN' : 'PARTNER'}</span>
        {role === 'admin' && !previewPartner && <button type="button" className="primary-button" onClick={() => setView('submit')}>+ New lead</button>}
      </div>
    </header>
  );
}

function LeadTable({ leads, onOpen, compact = false }) {
  if (!leads.length) {
    return <div className="empty-leads"><span>▥</span><strong>No leads in this workspace</strong><p>New assigned leads will appear here.</p></div>;
  }
  return (
    <div className={compact ? 'lead-table' : 'large-table'}>
      <div className={compact ? 'table-row table-head' : 'large-table-row partner-table-row large-table-head'}>
        <span>LEAD</span><span>EMAIL</span>{!compact && <span>PHONE</span>}<span>DESTINATION</span>{!compact && <span>PARTNER</span>}<span>STAGE</span><span>UPDATED</span>
      </div>
      {leads.map((lead) => (
        <button key={lead.id} type="button" className={compact ? 'table-row clickable-row' : 'large-table-row partner-table-row'} onClick={() => onOpen(lead.id)}>
          <span className="lead-person"><i>{lead.initials}</i><span><strong>{lead.name}</strong>{lead.isTest && <small className="test-badge">TEST LEAD</small>}</span></span>
          <span className="email-cell">{lead.email}</span>
          {!compact && <span className="phone-cell">{lead.phone || '—'}</span>}
          <span className="collection-cell">{lead.location}</span>
          {!compact && <span>{lead.partner}</span>}
          <span><i className={`stage ${stageClass(lead.stage)}`}>{lead.stage}</i></span>
          <span className="updated">{lead.age}<i aria-hidden="true">›</i></span>
        </button>
      ))}
    </div>
  );
}

function Overview({ leads, partners, openLead, setView, startPreview }) {
  const active = leads.filter((lead) => !['Won', 'Lost'].includes(lead.stage));
  const won = leads.filter((lead) => lead.stage === 'Won').length;
  const attention = leads.filter((lead) => ['New', 'Paused'].includes(lead.stage)).length;
  return (
    <>
      <div className="dashboard-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="live-pill"><i /> SECURE PARTNER PIPELINE</span>
            <h2>Every partner sees only their own opportunities.</h2>
            <p>Leads, progress notes and stage changes are stored centrally, while server-side access rules isolate each partner account.</p>
            <div className="hero-actions"><button className="light-button" type="button" onClick={() => setView('submit')}>Submit a lead <span>↗</span></button><button className="text-button" type="button" onClick={() => setView('leads')}>View all leads →</button></div>
          </div>
        </section>
        <section className="partner-card">
          <p className="mini-label">PARTNER DIRECTORY</p>
          <div className="partner-logo">{partners[0]?.name?.slice(0, 2) || '—'}</div>
          <div className="partner-status"><span /><strong>{partners.length} active workspaces</strong><small>Individually authenticated</small></div>
          <div className="partner-metrics"><span><strong>{leads.length}</strong><small>Total leads</small></span><span><strong>{active.length}</strong><small>Active</small></span></div>
          <button className="partner-link" type="button" onClick={() => setView('access')}>Manage partner access <span>→</span></button>
        </section>
      </div>
      <div className="stats-row">
        <article><span className="stat-icon violet">↗</span><span><small>TOTAL LEADS</small><strong>{leads.length}</strong><em>Across {partners.length} partners</em></span></article>
        <article><span className="stat-icon blue">◷</span><span><small>ACTIVE PIPELINE</small><strong>{active.length}</strong><em>Open opportunities</em></span></article>
        <article><span className="stat-icon amber">⌁</span><span><small>NEEDS ATTENTION</small><strong>{attention}</strong><em>New or paused</em></span></article>
        <article><span className="stat-icon mint">✓</span><span><small>CLOSED WON</small><strong>{won}</strong><em>Confirmed wins</em></span></article>
      </div>
      <section className="leads-card">
        <div className="ph-section-heading"><div><h3>Recent leads</h3><p>Latest activity across the partner network</p></div><button type="button" onClick={() => setView('leads')}>View all →</button></div>
        <LeadTable leads={leads.slice(0, 5)} onOpen={openLead} compact />
      </section>
      {partners.length > 0 && <div className="preview-grid">{partners.map((partner) => <button type="button" key={partner.id} onClick={() => startPreview(partner)}><span>{partner.name}</span><small>Preview isolated workspace →</small></button>)}</div>}
    </>
  );
}

function ShortlistCards({ shortlist, emptyCopy }) {
  if (!shortlist?.length) {
    return (
      <div className="studio-shortlist-empty">
        <span>⌂</span>
        <div><strong>No homes shortlisted yet</strong><p>{emptyCopy}</p></div>
      </div>
    );
  }
  return (
    <div className="studio-shortlist-grid">
      {shortlist.map((property) => (
        <a key={property.id} href={property.property_url} target="_blank" rel="noreferrer" className="studio-property-card">
          <span className="studio-property-image" style={property.property_image ? { backgroundImage: `url("${property.property_image}")` } : undefined} />
          <span className="studio-property-copy">
            <small>{property.property_location || 'COP COLLECTION'}</small>
            <strong>{property.property_title}</strong>
            <em>{formatPropertyPrice(property.property_price, property.property_currency)} <b>View listing ↗</b></em>
          </span>
        </a>
      ))}
    </div>
  );
}

function EngagementPanel({ lead, events }) {
  const received = events.find((event) => event.event_type === 'lead_created')?.created_at || lead.createdAt;
  const viewed = events.find((event) => event.event_type === 'lead_viewed')?.created_at;
  const contacted = events.find((event) => event.event_type === 'stage_changed' && event.to_stage !== 'New')?.created_at
    || (lead.stage !== 'New' ? lead.updatedAt : null);
  const viewing = events.find((event) => event.event_type === 'stage_changed' && ['Viewing', 'Reserved', 'Deposit paid', 'Won'].includes(event.to_stage))?.created_at
    || (['Viewing', 'Reserved', 'Deposit paid', 'Won'].includes(lead.stage) ? lead.updatedAt : null);
  const milestones = [
    ['Lead received', received],
    ['Partner viewed', viewed],
    ['Client contacted', contacted],
    ['Viewing booked', viewing],
  ];
  return (
    <div className="studio-engagement" aria-label="Lead engagement">
      {milestones.map(([label, date], index) => (
        <div key={label} className={date ? 'complete' : ''}>
          <span>{date ? '✓' : index + 1}</span>
          <strong>{label}</strong>
          <small>{formatMoment(date)}</small>
        </div>
      ))}
    </div>
  );
}

function PartnerLeadStudio({ leads, role, previewPartner, openLead, onChanged, showToast }) {
  const readOnly = Boolean(previewPartner);
  const [selectedId, setSelectedId] = useState(leads[0]?.id || '');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [helpNote, setHelpNote] = useState('');

  useEffect(() => {
    if (!leads.some((lead) => lead.id === selectedId)) setSelectedId(leads[0]?.id || '');
  }, [leads, selectedId]);

  useEffect(() => {
    let active = true;
    if (!selectedId) { setDetail(null); return () => { active = false; }; }
    setDetail(null);
    setLoading(true);
    hubRequest(`/api/partner-hub/leads/${selectedId}`)
      .then((payload) => { if (active) setDetail(payload); })
      .catch((error) => { if (active) showToast(error.message, true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  if (!leads.length) {
    return <section className="studio-empty"><span>▥</span><h2>No assigned leads yet</h2><p>A new COP introduction will appear here as soon as it is assigned.</p></section>;
  }
  const summary = leads.find((lead) => lead.id === selectedId) || leads[0];
  const lead = detail?.lead || summary;
  const events = detail?.events || [];
  const notes = detail?.notes || [];
  const latestCopNote = [...notes].reverse().find((note) => note.author_role === 'admin');

  async function markContacted() {
    if (readOnly || lead.stage !== 'New') { openLead(lead.id); return; }
    setBusy('stage');
    try {
      const payload = await hubRequest(`/api/partner-hub/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'stage', stage: 'Contacted' }),
      });
      onChanged(payload.lead);
      const refreshed = await hubRequest(`/api/partner-hub/leads/${lead.id}`);
      setDetail(refreshed);
      showToast('Lead marked as contacted and COP notified.');
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  async function requestHelp(event) {
    event.preventDefault();
    if (!helpNote.trim()) return showToast('Tell COP what help you need.', true);
    setBusy('help');
    try {
      const payload = await hubRequest(`/api/partner-hub/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'request_help', note: helpNote }),
      });
      onChanged(payload.lead);
      setHelpNote('');
      const refreshed = await hubRequest(`/api/partner-hub/leads/${lead.id}`);
      setDetail(refreshed);
      showToast(payload.notification?.status === 'failed' ? 'Request saved; the COP email needs attention.' : 'COP has received your help request.');
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  return (
    <section className="lead-studio">
      <div className="studio-heading studio-title-banner">
        <div><p className="mini-label">{lead.partner} · PRIVATE LEAD WORKSPACE</p><h2>Focus on the relationship.</h2><p>Everything needed to move this opportunity forward, in one secure view.</p></div>
        <button type="button" onClick={() => openLead(lead.id)}>Open full lead <span>↗</span></button>
      </div>
      <div className="studio-layout">
        <div className="studio-main">
          <article className="studio-identity-card">
            <div className="studio-status-row"><span className={`stage ${stageClass(lead.stage)}`}>{lead.stage}</span>{lead.isTest && <span className="test-badge">TEST LEAD</span>}<small>Updated {lead.age}</small></div>
            <h3>{lead.name}</h3>
            <div className="studio-contact-row"><a href={`mailto:${lead.email}`}>✉ {lead.email}</a><a href={lead.phone ? `tel:${lead.phone}` : undefined}>☎ {lead.phone || 'No phone supplied'}</a><span>◎ {lead.location}</span></div>
            <div className="studio-action-row">
              <button type="button" disabled={busy === 'stage' || readOnly} onClick={markContacted}>{busy === 'stage' ? 'Saving…' : lead.stage === 'New' ? 'Mark contacted' : 'Update stage'}</button>
              <button type="button" onClick={() => openLead(lead.id)}>Add progress note</button>
            </div>
          </article>

          <article className="studio-card">
            <header><div><small>ENGAGEMENT</small><h3>Lead journey</h3></div><span>Live audit trail</span></header>
            <EngagementPanel lead={lead} events={events} />
          </article>

          <div className="studio-two-column">
            <article className="studio-card studio-context"><small>ORIGINAL CONTEXT</small><h3>What the client wants</h3><p>{lead.note}</p><dl><div><dt>Budget</dt><dd>{lead.budget}</dd></div><div><dt>Nationality</dt><dd>{lead.nationality || 'Not supplied'}</dd></div></dl></article>
            <article className="studio-card studio-next"><small>NEXT ACTION</small><h3>{lead.stage === 'New' ? 'Make the first contact' : 'Keep the opportunity moving'}</h3><p>{latestCopNote?.body || 'Add a progress note after the next client conversation so both teams stay aligned.'}</p><button type="button" onClick={() => openLead(lead.id)}>Update lead →</button></article>
          </div>

          <article className="studio-card">
            <header><div><small>PROPERTY SHORTLIST</small><h3>Homes selected by COP</h3></div><span>{detail?.shortlist?.length || 0} saved</span></header>
            <ShortlistCards shortlist={detail?.shortlist || []} emptyCopy={readOnly ? 'Add live COP listings from the administrator lead drawer.' : 'COP will add suitable homes here, each linking to the full listing.'} />
          </article>
        </div>

        <aside className="studio-rail">
          <article className="studio-lead-switcher"><header><strong>All assigned leads</strong><small>{leads.length}</small></header>{leads.map((item) => <button type="button" className={item.id === lead.id ? 'active' : ''} key={item.id} onClick={() => setSelectedId(item.id)}><i>{item.initials}</i><span><strong>{item.name}</strong><small>{item.location} · {item.stage}</small></span><b>›</b></button>)}</article>
          <article className="studio-help-card">
            <span>?</span><h3>Request help from COP</h3><p>Ask for client context, property guidance, or help arranging the next step.</p>
            {readOnly ? <button type="button" disabled>Available to signed-in partner members</button> : <form onSubmit={requestHelp}><textarea value={helpNote} onChange={(event) => setHelpNote(event.target.value)} placeholder="How can COP help with this lead?" /><button disabled={busy === 'help'}>{busy === 'help' ? 'Sending…' : 'Send request to COP'}</button></form>}
          </article>
        </aside>
      </div>
      {loading && <div className="studio-loading">Refreshing secure lead…</div>}
    </section>
  );
}

function LeadsView({ leads, partners, role, previewPartner, openLead, onChanged, showToast }) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [partnerId, setPartnerId] = useState(previewPartner?.id || '');
  useEffect(() => setPartnerId(previewPartner?.id || ''), [previewPartner?.id]);
  const filtered = leads.filter((lead) => {
    const haystack = `${lead.name} ${lead.email} ${lead.phone}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (!stage || lead.stage === stage) && (!partnerId || lead.partnerId === partnerId);
  });

  if (role === 'partner' || previewPartner) {
    return <PartnerLeadStudio leads={leads} role={role} previewPartner={previewPartner} openLead={openLead} onChanged={onChanged} showToast={showToast} />;
  }

  return (
    <section className="view-card full-view">
      <div className="view-intro">
        <div><p className="mini-label">CO-OWNERSHIP PROPERTY</p><h2>{role === 'partner' || previewPartner ? 'Your assigned leads from COP' : 'Partner pipeline'}</h2><p>{previewPartner ? 'This preview is read-only and already filtered to the selected partner.' : 'Open a lead to review its secure details and activity.'}</p></div>
        <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or phone…" aria-label="Search leads" /></label>
      </div>
      <div className="filter-panel">
        {role === 'admin' && !previewPartner && <label>PARTNER<select value={partnerId} onChange={(event) => setPartnerId(event.target.value)}><option value="">All partners</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>}
        <label>PIPELINE STAGE<select value={stage} onChange={(event) => setStage(event.target.value)}><option value="">All stages</option>{PARTNER_HUB_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {(stage || partnerId || search) && <button type="button" onClick={() => { setStage(''); setPartnerId(previewPartner?.id || ''); setSearch(''); }}>Clear filters</button>}
      </div>
      <LeadTable leads={filtered} onOpen={openLead} />
      <footer className="table-footer"><span>Showing {filtered.length} of {leads.length} leads</span><span>‹ <b>1</b> ›</span></footer>
    </section>
  );
}

function SubmitLead({ partners, destinations, onCreated, showToast }) {
  const [form, setForm] = useState(EMPTY_LEAD);
  const [saving, setSaving] = useState(false);
  const selected = partners.find((partner) => partner.id === form.partnerId);
  function field(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await hubRequest('/api/partner-hub/leads', {
        method: 'POST',
        body: JSON.stringify({ ...form, phone: joinInternationalPhone(form.phoneDialCode, form.phone) }),
      });
      onCreated(payload.lead);
      setForm(EMPTY_LEAD);
      showToast(payload.notification?.status === 'failed' ? 'Lead saved; the notification email needs attention.' : `Lead saved${payload.notification?.status === 'sent' ? ' and partner notified.' : '.'}`);
    } catch (error) {
      showToast(error.message, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="submit-layout">
      <form className="view-card lead-form" onSubmit={submit}>
        <div className="view-intro"><div><p className="mini-label">SECURE INTRODUCTION</p><h2>Share a new lead</h2><p>The selected partner receives a private notification; contact details stay inside their portal.</p></div><span className="step-pill">LIVE DATA</span></div>
        <fieldset className="partner-assignment"><legend>Partner assignment</legend><div className="assignment-grid"><label>Assign to partner<small>Required before entering or sending the lead</small><select required value={form.partnerId} onChange={(event) => field('partnerId', event.target.value)}><option value="">Choose a partner first</option>{partners.filter((partner) => partner.active).map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label><div className={`assignment-recipient ${selected?.email ? 'ready' : 'incomplete'}`}><span>{selected?.email ? '✓' : '!'}</span><div><strong>{selected?.email ? `Notification is server-routed to ${selected.email}` : 'Configure the partner notification address first'}</strong><small>The browser cannot choose or replace the recipient.</small></div></div></div></fieldset>
        <fieldset disabled={!selected} className={!selected ? 'form-section-locked' : ''}><legend>Contact details</legend><div className="form-grid">
          <label>First name<input required value={form.firstName} onChange={(e) => field('firstName', e.target.value)} /></label>
          <label>Last name<input required value={form.lastName} onChange={(e) => field('lastName', e.target.value)} /></label>
          <label>Email address<input required type="email" value={form.email} onChange={(e) => field('email', e.target.value)} /></label>
          <label>Phone number<div className="phone-field"><DialCodeSelect id="new-lead-phone-code" value={form.phoneDialCode} onChange={(value) => field('phoneDialCode', value)} /><input type="tel" autoComplete="tel-national" value={form.phone} onChange={(e) => field('phone', e.target.value)} placeholder="7700 900 000" /></div></label>
          <label>Nationality<NationalitySelect id="new-lead-nationality" value={form.nationality} onChange={(value) => field('nationality', value)} /></label>
          <div className="field-group"><span>Destination</span><DestinationMultiSelect id="new-lead-destination" value={form.destination} onChange={(value) => field('destination', value)} destinations={destinations} /></div>
        </div></fieldset>
        <fieldset disabled={!selected} className={!selected ? 'form-section-locked' : ''}><legend>Opportunity</legend><div className="form-grid">
          <label>Collection or property type<input value={form.collectionType} onChange={(e) => field('collectionType', e.target.value)} placeholder="Managed co-ownership" /></label>
          <label>Approximate budget<BudgetSelect id="new-lead-budget" value={form.budget} onChange={(value) => field('budget', value)} /></label>
          <label className="wide">Context and preferences<textarea value={form.preferences} onChange={(e) => field('preferences', e.target.value)} placeholder="Timing, preferred location and useful sales context…" /></label>
        </div></fieldset>
        <label className={`form-consent ${!selected ? 'locked' : ''}`}><input required disabled={!selected} type="checkbox" checked={form.consentConfirmed} onChange={(e) => field('consentConfirmed', e.target.checked)} /><span>I confirm the customer has consented to their details being shared with the selected partner.</span></label>
        <div className="test-controls"><label><input type="checkbox" checked={form.isTest} onChange={(e) => field('isTest', e.target.checked)} /> Mark as synthetic test lead</label><label><input type="checkbox" checked={form.notifyPartner} onChange={(e) => field('notifyPartner', e.target.checked)} /> Send partner email after saving</label></div>
        <div className="form-actions"><button type="button" onClick={() => setForm(EMPTY_LEAD)}>Clear</button><button className="primary-button" disabled={!selected?.email || !form.consentConfirmed || saving}>{saving ? 'Saving…' : 'Save and declare lead'}</button></div>
      </form>
      <aside className="form-aside">
        <section className="aside-card dark"><p className="mini-label">WHAT HAPPENS NEXT</p><ol><li><b>01</b><span><strong>Partner is notified</strong><small>The address is loaded from the partner record on the server.</small></span></li><li><b>02</b><span><strong>Lead appears privately</strong><small>Only assigned partner members can read it.</small></span></li><li><b>03</b><span><strong>COP tracks every update</strong><small>Stages and notes persist with an audit trail.</small></span></li></ol></section>
        <section className="aside-card"><span className="shield-large">✓</span><h3>Privacy by design</h3><p>A partner ID is derived from the authenticated account. It is never accepted from the partner&apos;s browser when a lead is opened or updated.</p></section>
      </aside>
    </div>
  );
}

function PartnerAccess({ partners, members, onPartnerChanged, onMemberChanged, showToast, startPreview }) {
  const [drafts, setDrafts] = useState({});
  const [invite, setInvite] = useState({ partnerId: partners[0]?.id || '', name: '', email: '' });
  const [busy, setBusy] = useState('');
  useEffect(() => {
    setDrafts(Object.fromEntries(partners.map((partner) => [partner.id, { notificationName: partner.notificationName, email: partner.email, phone: partner.phone, testRouting: partner.testRouting, active: partner.active }])));
    setInvite((current) => ({ ...current, partnerId: current.partnerId || partners[0]?.id || '' }));
  }, [partners]);
  function draft(id, name, value) { setDrafts((current) => ({ ...current, [id]: { ...current[id], [name]: value } })); }

  async function save(partner) {
    setBusy(`save-${partner.id}`);
    try {
      const payload = await hubRequest('/api/partner-hub/partners', { method: 'PATCH', body: JSON.stringify({ id: partner.id, ...drafts[partner.id] }) });
      onPartnerChanged(payload.partner);
      showToast(`${partner.name} routing saved.`);
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  async function testEmail(partner) {
    setBusy(`test-${partner.id}`);
    try {
      const payload = await hubRequest('/api/partner-hub/partners', { method: 'POST', body: JSON.stringify({ action: 'test_notification', partnerId: partner.id }) });
      showToast(`Test email ${payload.delivery?.status === 'sent' ? 'sent' : payload.delivery?.status} to ${payload.delivery?.recipient}.`);
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  async function sendInvite(event) {
    event.preventDefault();
    setBusy('invite');
    try {
      const payload = await hubRequest('/api/partner-hub/invitations', { method: 'POST', body: JSON.stringify(invite) });
      showToast(payload.message);
      if (payload.member) onMemberChanged(payload.member);
      setInvite((current) => ({ ...current, name: '', email: '' }));
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  async function toggleMember(member) {
    setBusy(`member-${member.id}`);
    try {
      const payload = await hubRequest('/api/partner-hub/members', { method: 'PATCH', body: JSON.stringify({ id: member.id, active: !member.active }) });
      onMemberChanged(payload.member);
      showToast(`${payload.member.email} access ${payload.member.active ? 'restored' : 'revoked'}.`);
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  async function sendMemberCode(member) {
    setBusy(`code-${member.id}`);
    try {
      const payload = await hubRequest('/api/partner-hub/invitations', {
        method: 'POST',
        body: JSON.stringify({ action: 'send_code', memberId: member.id }),
      });
      showToast(payload.message);
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  return (
    <section className="view-card full-view">
      <div className="view-intro"><div><p className="mini-label">IDENTITY AND ROUTING</p><h2>Partner access</h2><p>Every person signs in with their own email. Never share an administrator password.</p></div><span className="secure-model-pill">SERVER ENFORCED</span></div>
      <div className="access-security-banner"><span>✓</span><div><strong>One partner organisation per login</strong><p>Database rules and server checks both enforce the same boundary. A Vivla member cannot query, open or update 21-5 leads.</p></div></div>
      <div className="partner-access-grid">
        {partners.map((partner) => {
          const values = drafts[partner.id] || {};
          return <article key={partner.id} className="partner-access-card">
            <header><span className="partner-logo">{partner.name.slice(0, 2)}</span><div><small>PARTNER WORKSPACE</small><h3>{partner.name}</h3></div><span className={partner.testRouting ? 'test-route-pill' : 'live-route-pill'}>{partner.testRouting ? 'TEST ROUTING' : 'LIVE'}</span></header>
            <div className="partner-routing-form">
              <label>Contact name<input value={values.notificationName || ''} onChange={(e) => draft(partner.id, 'notificationName', e.target.value)} /></label>
              <label>Notification email<input type="email" value={values.email || ''} onChange={(e) => draft(partner.id, 'email', e.target.value)} /></label>
              <label>Phone<input value={values.phone || ''} onChange={(e) => draft(partner.id, 'phone', e.target.value)} /></label>
              <label className="routing-toggle"><input type="checkbox" checked={values.testRouting !== false} onChange={(e) => draft(partner.id, 'testRouting', e.target.checked)} /> Keep all notifications in test routing</label>
            </div>
            <div className="member-list">
              <small>INVITED LOGINS</small>
              {members.filter((member) => member.partnerId === partner.id).length === 0 ? <p>No partner login has been invited yet.</p> : members.filter((member) => member.partnerId === partner.id).map((member) => <div key={member.id}><span><strong>{member.name || member.email}</strong><small>{member.email}</small></span><span className="member-actions">{member.active && <button type="button" disabled={busy === `code-${member.id}`} className="send-member-code" onClick={() => sendMemberCode(member)}>{busy === `code-${member.id}` ? 'Sending…' : 'Send sign-in code'}</button>}<button type="button" disabled={busy === `member-${member.id}`} className={member.active ? 'revoke-member' : 'restore-member'} onClick={() => toggleMember(member)}>{member.active ? 'Revoke access' : 'Restore access'}</button></span></div>)}
            </div>
            <div className="partner-card-actions"><button type="button" onClick={() => startPreview(partner)}>Preview isolated portal</button><button type="button" disabled={busy === `test-${partner.id}` || !values.testRouting} onClick={() => testEmail(partner)}>{busy === `test-${partner.id}` ? 'Sending…' : 'Send test email'}</button><button className="primary-inline" type="button" disabled={busy === `save-${partner.id}`} onClick={() => save(partner)}>{busy === `save-${partner.id}` ? 'Saving…' : 'Save routing'}</button></div>
          </article>;
        })}
      </div>
      <form className="invite-form" onSubmit={sendInvite}>
        <div><p className="mini-label">INDIVIDUAL PARTNER LOGIN</p><h3>Invite a team member</h3><p>They receive their own one-time invitation. Existing COP administrator emails are refused.</p></div>
        <label>Partner<select required value={invite.partnerId} onChange={(e) => setInvite({ ...invite, partnerId: e.target.value })}>{partners.filter((partner) => partner.active).map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
        <label>Name<input required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></label>
        <label>Email<input required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></label>
        <button className="primary-inline" disabled={busy === 'invite'}>{busy === 'invite' ? 'Sending…' : 'Send secure invitation'}</button>
      </form>
    </section>
  );
}

function ShortlistEditor({ lead, shortlist, onRefresh, showToast }) {
  const [catalogue, setCatalogue] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let active = true;
    hubRequest('/api/partner-hub/properties')
      .then((payload) => { if (active) setCatalogue(payload.properties || []); })
      .catch((error) => { if (active) showToast(error.message, true); });
    return () => { active = false; };
  }, []);

  const savedSlugs = new Set(shortlist.map((property) => property.property_slug));
  const matches = catalogue.filter((property) => {
    const haystack = `${property.title} ${property.location} ${property.slug}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  }).slice(0, 12);

  async function updateShortlist(operation, propertySlug) {
    setBusy(`${operation}-${propertySlug}`);
    try {
      await hubRequest(`/api/partner-hub/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'shortlist', operation, propertySlug }),
      });
      await onRefresh();
      showToast(operation === 'add' ? 'COP listing added to the partner shortlist.' : 'Listing removed from the partner shortlist.');
    } catch (error) { showToast(error.message, true); } finally { setBusy(''); }
  }

  return (
    <section className="drawer-section shortlist-editor">
      <small>PROPERTY SHORTLIST</small>
      {shortlist.length > 0 && <div className="drawer-shortlist-saved">{shortlist.map((property) => <div key={property.id}><span className="drawer-property-thumb" style={property.property_image ? { backgroundImage: `url("${property.property_image}")` } : undefined} /><span><strong>{property.property_title}</strong><small>{property.property_location || 'COP listing'}</small></span><button type="button" disabled={busy === `remove-${property.property_slug}`} onClick={() => updateShortlist('remove', property.property_slug)}>Remove</button></div>)}</div>}
      <label className="shortlist-search">Choose from live COP listings<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search property, destination or slug…" /></label>
      <div className="shortlist-catalogue">
        {matches.map((property) => {
          const saved = savedSlugs.has(property.slug);
          return <div key={property.slug}><span className="drawer-property-thumb" style={property.image ? { backgroundImage: `url("${property.image}")` } : undefined} /><span><strong>{property.title}</strong><small>{property.location || 'COP listing'} · {formatPropertyPrice(property.price, property.currency)}</small></span><button type="button" disabled={saved || busy === `add-${property.slug}`} onClick={() => updateShortlist('add', property.slug)}>{saved ? 'Added' : busy === `add-${property.slug}` ? 'Adding…' : '+ Add'}</button></div>;
        })}
      </div>
    </section>
  );
}

function AdminLeadEditor({ lead, destinations, onSaved, showToast }) {
  const initialPhone = splitInternationalPhone(lead.phone);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: initialPhone.localNumber,
    phoneDialCode: initialPhone.dialCode,
    nationality: lead.nationality,
    destination: lead.location === '—' ? '' : lead.location,
    collectionType: lead.collection === '—' ? '' : lead.collection,
    budget: lead.budget === 'Not specified' ? '' : lead.budget,
    preferences: lead.note === 'No additional context supplied.' ? '' : lead.note,
  });

  useEffect(() => {
    const phone = splitInternationalPhone(lead.phone);
    setFields({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: phone.localNumber,
      phoneDialCode: phone.dialCode,
      nationality: lead.nationality,
      destination: lead.location === '—' ? '' : lead.location,
      collectionType: lead.collection === '—' ? '' : lead.collection,
      budget: lead.budget === 'Not specified' ? '' : lead.budget,
      preferences: lead.note === 'No additional context supplied.' ? '' : lead.note,
    });
  }, [lead.id, lead.updatedAt]);

  function field(name, value) { setFields((current) => ({ ...current, [name]: value })); }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await hubRequest(`/api/partner-hub/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'edit',
          fields: { ...fields, phone: joinInternationalPhone(fields.phoneDialCode, fields.phone) },
        }),
      });
      await onSaved(payload.lead);
      setEditing(false);
      showToast('Lead contact details updated for COP and the assigned partner.');
    } catch (error) { showToast(error.message, true); } finally { setSaving(false); }
  }

  return (
    <section className="drawer-section admin-lead-editor">
      <div className="drawer-section-heading"><small>ADMIN LEAD DETAILS</small><button className={`edit-details-button${editing ? ' is-editing' : ''}`} type="button" onClick={() => setEditing((current) => !current)}>{editing ? 'Cancel editing' : 'Edit lead details'}</button></div>
      {!editing ? <p className="editor-readback">Correct the client&apos;s name, email, phone, destination, budget or original context here. Changes appear immediately in the assigned partner workspace.</p> : <form className="edit-lead-grid" onSubmit={save}>
        <label>First name<input required value={fields.firstName} onChange={(event) => field('firstName', event.target.value)} /></label>
        <label>Last name<input required value={fields.lastName} onChange={(event) => field('lastName', event.target.value)} /></label>
        <label className="wide">Email address<input required type="email" value={fields.email} onChange={(event) => field('email', event.target.value)} /></label>
        <label className="wide">Phone number<div className="phone-field"><DialCodeSelect id={`edit-lead-phone-code-${lead.id}`} value={fields.phoneDialCode} onChange={(value) => field('phoneDialCode', value)} /><input type="tel" autoComplete="tel-national" value={fields.phone} onChange={(event) => field('phone', event.target.value)} placeholder="7700 900 000" /></div></label>
        <label>Nationality<NationalitySelect id={`edit-lead-nationality-${lead.id}`} value={fields.nationality} onChange={(value) => field('nationality', value)} /></label>
        <div className="field-group wide"><span>Destination</span><DestinationMultiSelect id={`edit-lead-destination-${lead.id}`} value={fields.destination} onChange={(value) => field('destination', value)} destinations={destinations} /></div>
        <label>Property type<input value={fields.collectionType} onChange={(event) => field('collectionType', event.target.value)} /></label>
        <label>Budget<BudgetSelect id={`edit-lead-budget-${lead.id}`} value={fields.budget} onChange={(value) => field('budget', value)} /></label>
        <label className="wide">Original context<textarea value={fields.preferences} onChange={(event) => field('preferences', event.target.value)} /></label>
        <button className="save-details" disabled={saving}>{saving ? 'Saving…' : 'Save corrected lead details'}</button>
      </form>}
    </section>
  );
}

function LeadDrawer({ leadId, role, readOnly, destinations, onClose, onChanged, showToast }) {
  const [detail, setDetail] = useState(null);
  const [stage, setStage] = useState('New');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let active = true;
    hubRequest(`/api/partner-hub/leads/${leadId}`).then((payload) => { if (active) { setDetail(payload); setStage(payload.lead.stage); } }).catch((error) => showToast(error.message, true));
    return () => { active = false; };
  }, [leadId]);

  const isAdminWorkspace = role === 'admin' && !readOnly;
  const backdropClassName = `drawer-backdrop${isAdminWorkspace ? ' admin-lead-backdrop' : ''}`;
  const drawerClassName = `lead-drawer${isAdminWorkspace ? ' admin-lead-workspace' : ''}`;

  if (!detail) return <div className={backdropClassName} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className={drawerClassName}><button className="drawer-close" type="button" onClick={onClose}>×</button><div className="hub-loading">Loading secure lead…</div></aside></div>;
  const { lead, notes, events } = detail;

  async function saveProgress(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const action = role === 'partner' && stage !== lead.stage ? 'stage' : 'note';
      if (action === 'note' && !note.trim()) throw new Error('Add a progress note or change the stage first.');
      const payload = await hubRequest(`/api/partner-hub/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ action, stage, note }) });
      onChanged(payload.lead || { ...lead, age: 'Just now' });
      showToast(action === 'stage' ? 'Pipeline stage saved and COP notified.' : 'Progress note saved.');
      setNote('');
      const refreshed = await hubRequest(`/api/partner-hub/leads/${lead.id}`);
      setDetail(refreshed);
      setStage(refreshed.lead.stage);
    } catch (error) { showToast(error.message, true); } finally { setSaving(false); }
  }

  async function deleteLead() {
    setDeleting(true);
    try {
      await hubRequest(`/api/partner-hub/leads/${lead.id}`, { method: 'DELETE' });
      onChanged({ id: lead.id, deleted: true });
      showToast(`${lead.name} was deleted from the Partner Hub.`);
      onClose();
    } catch (error) {
      showToast(error.message, true);
      setDeleting(false);
    }
  }

  return (
    <div className={backdropClassName} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className={drawerClassName} aria-label={`${lead.name} details`}>
        <button className="drawer-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <span className={`stage ${stageClass(lead.stage)}`}>{lead.stage}</span>
        <div className="drawer-person"><span>{lead.initials}</span><div><h2>{lead.name}</h2><p>{lead.location}{lead.isTest ? ' · SYNTHETIC TEST LEAD' : ''}</p></div></div>
        <div className="pipeline-owner-banner"><span>↗</span><div><strong>{readOnly ? 'Read-only partner preview' : role === 'partner' ? 'You manage this sales pipeline' : 'The assigned partner manages the stage'}</strong><small>{readOnly ? 'Use a real partner login to test updates.' : role === 'partner' ? 'COP is notified automatically after your update.' : 'You can add context without impersonating the partner.'}</small></div></div>
        <section className="drawer-section"><small>LEAD DETAILS</small><div className="lead-detail-list"><p><span>✉</span>{lead.email}</p><p><span>☎</span>{lead.phone || 'No phone supplied'}</p><p><span>◎</span>{lead.nationality || 'Nationality not supplied'}</p><p><span>▥</span>{lead.location}</p><p><span>€</span>{lead.budget}</p></div></section>
        <section className="drawer-section"><small>ASSIGNED PARTNER</small><div className="drawer-partner"><span>{lead.partner.slice(0, 2)}</span><div><strong>{lead.partner}</strong><p>Lead shared by Co-Ownership Property</p></div></div></section>
        <section className="drawer-section"><small>ORIGINAL LEAD CONTEXT</small><p className="note-box">{lead.note}</p></section>
        {role === 'admin' && !readOnly && <AdminLeadEditor lead={lead} destinations={destinations} onSaved={async (updated) => { onChanged(updated); setDetail(await hubRequest(`/api/partner-hub/leads/${lead.id}`)); }} showToast={showToast} />}
        {role === 'admin' && !readOnly && <ShortlistEditor lead={lead} shortlist={detail.shortlist || []} onRefresh={async () => setDetail(await hubRequest(`/api/partner-hub/leads/${lead.id}`))} showToast={showToast} />}
        {(role === 'partner' || readOnly) && <section className="drawer-section"><small>PROPERTY SHORTLIST</small><ShortlistCards shortlist={detail.shortlist || []} emptyCopy={readOnly ? 'Add live COP listings from the administrator lead drawer.' : 'COP will add suitable homes here.'} /></section>}
        {notes.length > 0 && <section className="drawer-section"><small>PROGRESS NOTES</small><div className="drawer-timeline">{notes.map((item) => <div key={item.id}><i className={item.author_role === 'partner' ? 'partner-event' : ''}>{item.author_role === 'partner' ? 'P' : 'CO'}</i><div><strong>{item.body}</strong><small>{item.author_role} · {new Date(item.created_at).toLocaleString()}</small></div></div>)}</div></section>}
        {events.length > 0 && <section className="drawer-section"><small>AUDIT TRAIL</small><div className="drawer-timeline">{events.map((item) => <div key={item.id}><i className={item.actor_role === 'partner' ? 'partner-event' : ''}>✓</i><div><strong>{formatEvent(item)}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div></div>)}</div></section>}
        {!readOnly && <form className="partner-pipeline-form" onSubmit={saveProgress}>
          {role === 'partner' && <label className="drawer-stage">Update pipeline stage<select value={stage} onChange={(e) => setStage(e.target.value)}>{PARTNER_HUB_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label>{role === 'partner' ? 'Add a progress note' : 'Add an update from COP'}<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context, next step or a client update…" /></label>
          <button className="drawer-action" disabled={saving || (!note.trim() && stage === lead.stage)}>{saving ? 'Saving…' : role === 'partner' ? 'Save pipeline update' : 'Save COP update'}</button>
        </form>}
        {role === 'admin' && !readOnly && <section className="drawer-section">
          <small>ADMINISTRATOR ACTIONS</small>
          {!confirmDelete ? <button type="button" className="delete-lead-button" onClick={() => setConfirmDelete(true)}>Delete lead</button> : <div className="delete-confirmation"><span>!</span><div><strong>Delete {lead.name}?</strong><p>This permanently removes the lead, its notes, audit events and notification history. It cannot be undone.</p></div><div><button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button><button type="button" disabled={deleting} onClick={deleteLead}>{deleting ? 'Deleting…' : 'Delete permanently'}</button></div></div>}
        </section>}
      </aside>
    </div>
  );
}

export default function PartnerHubWorkspace({ entry = 'admin' }) {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [access, setAccess] = useState(null);
  const [partners, setPartners] = useState([]);
  const [members, setMembers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [view, setView] = useState(entry === 'partner' ? 'leads' : 'overview');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [previewPartner, setPreviewPartner] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, error = false) {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionPayload = await hubRequest('/api/partner-hub/session');
        if (!active) return;
        const requiredRole = entry === 'admin' ? 'admin' : 'partner';
        if (sessionPayload.access.role !== requiredRole) {
          router.replace(sessionPayload.access.role === 'admin' ? '/admin/partners/' : '/partner/');
          return;
        }
        const [partnerPayload, leadPayload, memberPayload, optionPayload] = await Promise.all([
          hubRequest('/api/partner-hub/partners'),
          hubRequest('/api/partner-hub/leads'),
          sessionPayload.access.role === 'admin' ? hubRequest('/api/partner-hub/members') : Promise.resolve({ members: [] }),
          sessionPayload.access.role === 'admin' ? hubRequest('/api/partner-hub/options') : Promise.resolve({ destinations: [] }),
        ]);
        if (!active) return;
        setAccess(sessionPayload.access);
        setPartners(partnerPayload.partners || []);
        setLeads(leadPayload.leads || []);
        setMembers(memberPayload.members || []);
        setDestinations(optionPayload.destinations || []);
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          router.replace(entry === 'admin' ? '/admin/login' : '/partner/login');
          return;
        }
        setStatus('error');
        setToast({ message: error.message, error: true });
      }
    }
    load();
    return () => { active = false; };
  }, [entry, router]);

  const visibleLeads = useMemo(() => previewPartner ? leads.filter((lead) => lead.partnerId === previewPartner.id) : leads, [leads, previewPartner]);
  const title = previewPartner ? `${previewPartner.name} partner view` : view === 'overview' ? 'Partner Hub overview' : view === 'leads' ? (entry === 'partner' ? 'Your assigned leads' : 'All partner leads') : view === 'submit' ? 'New lead' : 'Partner access';

  function updateLead(next) {
    if (!next?.id) return;
    if (next.deleted) {
      setLeads((current) => current.filter((lead) => lead.id !== next.id));
      return;
    }
    setLeads((current) => current.map((lead) => lead.id === next.id ? { ...lead, ...next } : lead));
  }
  function startPreview(partner) { setPreviewPartner(partner); setView('leads'); }
  async function signOut() { await supabase.auth.signOut(); router.push(entry === 'admin' ? '/admin/login' : '/partner/login'); }

  if (status !== 'ready') {
    return <div className="partner-hub-root hub-gate"><Head><title>Secure Partner Hub | COP</title><meta name="robots" content="noindex,nofollow,noarchive" /></Head><Brand /><div className={status === 'error' ? 'hub-error-state' : 'hub-loading'}>{status === 'error' ? 'Partner Hub could not be loaded. Check the secure configuration and try again.' : 'Verifying secure Partner Hub access…'}</div>{toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`}><span>{toast.error ? '!' : '✓'}</span>{toast.message}</div>}</div>;
  }

  return (
    <div className="partner-hub-root">
      <Head><title>{entry === 'admin' ? 'COP Admin Partner Hub' : `${partners[0]?.name || 'Partner'} | COP Partner Hub`}</title><meta name="robots" content="noindex,nofollow,noarchive" /></Head>
      <div className="portal-shell">
        <Sidebar role={access.role} view={view} setView={(next) => { setPreviewPartner(null); setView(next); }} leadCount={visibleLeads.length} partner={partners[0]} previewPartner={previewPartner} onPreviewEnd={() => { setPreviewPartner(null); setView('overview'); }} email={access.email} onSignOut={signOut} />
        <main className="workspace">
          <Topbar role={access.role} title={title} setView={setView} previewPartner={previewPartner} />
          {view === 'overview' && access.role === 'admin' && <Overview leads={leads} partners={partners} openLead={setSelectedLeadId} setView={setView} startPreview={startPreview} />}
          {view === 'leads' && <LeadsView leads={visibleLeads} partners={partners} role={access.role} previewPartner={previewPartner} openLead={setSelectedLeadId} onChanged={updateLead} showToast={showToast} />}
          {view === 'submit' && access.role === 'admin' && <SubmitLead partners={partners} destinations={destinations} onCreated={(lead) => { setLeads((current) => [lead, ...current]); setView('leads'); }} showToast={showToast} />}
          {view === 'access' && access.role === 'admin' && <PartnerAccess partners={partners} members={members} onPartnerChanged={(next) => setPartners((current) => current.map((partner) => partner.id === next.id ? next : partner))} onMemberChanged={(next) => setMembers((current) => current.some((member) => member.id === next.id) ? current.map((member) => member.id === next.id ? next : member) : [next, ...current])} showToast={showToast} startPreview={startPreview} />}
        </main>
      </div>
      {selectedLeadId && <LeadDrawer leadId={selectedLeadId} role={access.role} readOnly={Boolean(previewPartner)} destinations={destinations} onClose={() => setSelectedLeadId(null)} onChanged={updateLead} showToast={showToast} />}
      {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`}><span>{toast.error ? '!' : '✓'}</span>{toast.message}</div>}
    </div>
  );
}
