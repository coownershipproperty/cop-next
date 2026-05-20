import { HONEYPOT_FIELD } from '@/lib/honeypot';

// ── Honeypot field ───────────────────────────────────────────────────────────
// A hidden text input, invisible to real users — positioned off-screen, skipped
// by keyboard tabbing (tabIndex -1) and hidden from screen readers (aria-hidden).
// Automated bots fill in every field they can find, so any value submitted here
// flags the request as spam (see lib/honeypot.js and the form API routes).
//
// DO NOT REMOVE this field or make it visible — it is intentional anti-spam
// protection, not a layout bug. Render it as a child of each enquiry <form>.
export default function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label>
        Company website (leave this field empty)
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
