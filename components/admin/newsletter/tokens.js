/**
 * Shared style tokens + tiny primitives for the Newsletter admin pages.
 * Matches the aesthetic of pages/admin/property/[slug].js exactly.
 */
export const C = {
  blue: '#2C4A5E', blueLight: '#3a5f78',
  gold: '#C9A84C', goldDark: '#a98a36',
  cream: '#F5F2EC', bg: '#faf9f7',
  white: '#ffffff',
  text: '#1a2533', muted: '#5a6a7a', faint: '#8a9aaa',
  border: '#e8e0d4',
  green: '#065f46', greenBg: '#ecfdf5', greenBorder: '#a7f3d0',
  red: '#dc2626', redBg: '#fef2f2',
  amber: '#92400e', amberBg: '#fffbeb', amberBorder: '#fcd34d',
  grey: '#6b7280', greyBg: '#f3f4f6', greyBorder: '#d1d5db',
  blueBadge: '#1e40af', blueBadgeBg: '#dbeafe', blueBadgeBorder: '#bfdbfe',
}

export const input = {
  width: '100%',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: C.text,
  background: C.white,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: '"Nunito Sans", sans-serif',
  transition: 'border-color 0.15s',
}

export const label = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: C.faint,
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

export const STATUS_BADGE = {
  draft:     { label: 'Draft',     bg: C.greyBg,     color: C.grey,      border: C.greyBorder },
  scheduled: { label: 'Scheduled', bg: C.blueBadgeBg, color: C.blueBadge, border: C.blueBadgeBorder },
  sending:   { label: 'Sending',   bg: C.amberBg,    color: C.amber,     border: C.amberBorder, pulse: true },
  sent:      { label: 'Sent',      bg: C.greenBg,    color: C.green,     border: C.greenBorder },
}
