import { useState, useEffect, useRef } from 'react';

// ── Destination tree ────────────────────────────────────────────────────────
const DEST_TREE = [
  {
    country: 'Spain',
    children: [
      'Mallorca', 'Ibiza', 'Menorca', 'Balearic Islands',
      'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanish Costas',
      'Barcelona', 'Madrid', 'Canary Islands', 'Pyrenees',
    ],
  },
  {
    country: 'France',
    children: ['South of France', 'French Alps', 'Paris'],
  },
  {
    country: 'Italy',
    children: ['Italian Lakes', 'Lake Como', 'Lake Garda', 'Liguria', 'Sardinia'],
  },
  {
    country: 'USA — Colorado',
    children: ['Aspen', 'Breckenridge', 'Vail'],
  },
  {
    country: 'USA — Florida',
    children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'],
  },
  {
    country: 'USA — California',
    children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'],
  },
  {
    country: 'USA — Utah',
    children: ['Park City'],
  },
  {
    country: 'United Kingdom',
    children: ['London', 'England'],
  },
  {
    country: 'Other',
    children: ['Austria', 'Croatia', 'Germany', 'Mexico', 'Portugal', 'Sweden'],
  },
];

function DestinationPicker({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function toggleExpand(country) {
    setExpanded(prev => ({ ...prev, [country]: !prev[country] }));
  }

  function toggleOption(val) {
    onChange(
      selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val]
    );
  }

  function removeTag(val, e) {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  }

  return (
    <div className={`dest-multiselect${open ? ' open' : ''}`} ref={wrapRef}>
      {/* Trigger */}
      <div
        className="dest-trigger"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
      >
        {selected.length === 0 && (
          <span className="dest-placeholder">Select destinations…</span>
        )}
        {selected.map(val => (
          <span key={val} className="dest-tag">
            {val}
            <span className="dest-tag-x" onMouseDown={e => removeTag(val, e)}>×</span>
          </span>
        ))}
      </div>

      {/* Dropdown */}
      <div className="dest-dropdown" role="listbox" aria-multiselectable="true">
        {DEST_TREE.map(({ country, children }) => (
          <div key={country} className="dest-group">
            {/* Country header — click to expand/collapse */}
            <div
              className={`dest-group-header${expanded[country] ? ' expanded' : ''}`}
              onClick={() => toggleExpand(country)}
            >
              <span className="dest-group-arrow">›</span>
              {country}
            </div>

            {/* Children — shown when expanded */}
            {expanded[country] && (
              <div className="dest-group-children">
                {children.map(child => {
                  const isSelected = selected.includes(child);
                  return (
                    <div
                      key={child}
                      className={`dest-option${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleOption(child)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="dest-check" />
                      {child}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpertForm({ property }) {
  const [destinations, setDestinations] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [msg, setMsg] = useState('');
  const formRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    const name     = form.querySelector('[name="name"]').value.trim();
    const email    = form.querySelector('[name="email"]').value.trim();
    const phone    = form.querySelector('[name="phone"]').value.trim();
    const budget   = form.querySelector('[name="budget"]').value;
    const message  = form.querySelector('[name="message"]').value.trim();
    const destStr  = destinations.join('; ');

    if (!name || !email) {
      setMsg('Please fill in your name and email.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, budget, destination: destStr, message, property }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        setMsg("Thank you! We'll be in touch within 24 hours.");
        form.reset();
        setDestinations([]);
      } else {
        setStatus('error');
        setMsg('Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  }

  return (
    <section className="expert-section" id="speak-to-expert">
      <div className="expert-inner">
        <p className="expert-eyebrow">Get in Touch</p>
        <h2 className="expert-heading">Speak to an <em>expert</em></h2>
        <p className="expert-sub">Tell us what you&apos;re looking for and one of our co-ownership specialists will be in touch within 24 hours.</p>

        <form className="expert-form" id="expert-enquiry-form" onSubmit={handleSubmit} noValidate ref={formRef}>
          <div className="expert-form-grid">

            <div className="expert-form-field">
              <label htmlFor="ef-name">Name <span>*</span></label>
              <input type="text" id="ef-name" name="name" placeholder="Your full name" required />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-email">Email <span>*</span></label>
              <input type="email" id="ef-email" name="email" placeholder="your@email.com" required />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-phone">Phone</label>
              <input type="tel" id="ef-phone" name="phone" placeholder="+44 or +1…" />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-budget">Approximate Budget</label>
              <select id="ef-budget" name="budget">
                <option value="">Select range</option>
                <option value="under-100k">Under €100,000</option>
                <option value="100-200k">€100,000 – €200,000</option>
                <option value="200-350k">€200,000 – €350,000</option>
                <option value="350-500k">€350,000 – €500,000</option>
                <option value="500-750k">€500,000 – €750,000</option>
                <option value="750k-1m">€750,000 – €1,000,000</option>
                <option value="1m-plus">€1,000,000+</option>
              </select>
            </div>

            {/* Destination multi-select — full width */}
            <div className="expert-form-field expert-form-field--wide">
              <label>Destinations Interested In</label>
              <DestinationPicker selected={destinations} onChange={setDestinations} />
            </div>

            <div className="expert-form-field expert-form-field--wide">
              <label htmlFor="ef-message">Message</label>
              <textarea id="ef-message" name="message" rows={4} placeholder="Tell us about the destination, property type, or anything else…"></textarea>
            </div>

          </div>

          <button
            type="submit"
            className="expert-submit-btn"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : status === 'success' ? 'Sent!' : 'Send Enquiry'}
          </button>

          {msg && (
            <p className={`expert-form-msg${status === 'success' ? ' success' : ' error'}`}>{msg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
