/**
 * Reusable primitives for the Newsletter admin pages.
 * Card, Field, Grid, Toast, StatusBadge — match the COP-luxury aesthetic.
 */
import { useEffect } from 'react'
import { C, label, STATUS_BADGE } from './tokens'

export function Card({ title, right, children, padding }) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: padding || '20px 22px',
      boxShadow: '0 1px 4px rgba(44,74,94,0.04)',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '0 0 18px', paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
          gap: 12,
        }}>
          <h2 style={{
            fontSize: 11, fontWeight: 700, color: C.faint,
            textTransform: 'uppercase', letterSpacing: '0.8px',
            margin: 0,
          }}>
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function Field({ l, hint, children }) {
  return (
    <div>
      <label style={label}>{l}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: C.faint, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

export function Grid({ cols, gap, children, style }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: typeof cols === 'string' ? cols : `repeat(${cols}, 1fr)`,
      gap: gap || 14,
      ...(style || {}),
    }}>
      {children}
    </div>
  )
}

export function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.draft
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      textTransform: 'uppercase', letterSpacing: '0.4px',
      whiteSpace: 'nowrap',
      animation: cfg.pulse ? 'newsletter-pulse 1.4s ease-in-out infinite' : 'none',
    }}>
      {cfg.label}
    </span>
  )
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, toast.duration || 3500)
    return () => clearTimeout(t)
  }, [toast, onClose])
  if (!toast) return null

  const isError = toast.kind === 'error'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: isError ? C.redBg : C.greenBg,
      color: isError ? C.red : C.green,
      border: `1px solid ${isError ? '#fecaca' : C.greenBorder}`,
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(44,74,94,0.15)',
      zIndex: 9999,
      maxWidth: 360,
      fontFamily: '"Nunito Sans", sans-serif',
    }}>
      {toast.text}
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, kind, style, ...rest }) {
  const isGold = kind === 'gold'
  const bg = isGold ? C.gold : C.blue
  const hover = isGold ? C.goldDark : C.blueLight
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#cdd2d8' : bg,
        color: C.white,
        border: 'none',
        borderRadius: 10,
        padding: '10px 22px',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        fontFamily: '"Nunito Sans", sans-serif',
        letterSpacing: '0.2px',
        ...(style || {}),
      }}
      onMouseEnter={e => { if (!disabled) e.target.style.background = hover }}
      onMouseLeave={e => { if (!disabled) e.target.style.background = bg }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, disabled, style, ...rest }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: C.white,
        color: C.blue,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        fontFamily: '"Nunito Sans", sans-serif',
        ...(style || {}),
      }}
      onMouseEnter={e => { if (!disabled) { e.target.style.background = C.bg; e.target.style.borderColor = C.blue } }}
      onMouseLeave={e => { if (!disabled) { e.target.style.background = C.white; e.target.style.borderColor = C.border } }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function FocusInput(props) {
  const { style, ...rest } = props
  return (
    <input
      {...rest}
      style={style}
      onFocus={e => { e.target.style.borderColor = C.blue; props.onFocus?.(e) }}
      onBlur={e => { e.target.style.borderColor = C.border; props.onBlur?.(e) }}
    />
  )
}

/**
 * Inject the pulse keyframes once per page.
 */
export function GlobalAnimations() {
  return (
    <style>{`
      @keyframes newsletter-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.65; transform: scale(0.97); }
      }
      @keyframes newsletter-count-pop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.15); color: ${C.gold}; }
        100% { transform: scale(1); }
      }
      .nl-count-pulse { animation: newsletter-count-pop 0.4s ease; }
    `}</style>
  )
}
