import { useEffect, useId, useRef, useState } from 'react';

/** Select-only combobox: focus stays on the trigger while navigating options. */
export default function FilterSelect({ label, value, options, onChange, multiple = false }) {
  const id = useId();
  const root = useRef(null);
  const typeahead = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [menuHeight, setMenuHeight] = useState(280);
  const keyboardMove = useRef(true);
  const selected = Math.max(0, options.findIndex(option => String(option.value) === String(value)));
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const dismiss = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => {
    if (!open || !keyboardMove.current) return;
    const menu = root.current?.querySelector('[role="listbox"]');
    const option = menu?.querySelector(`[data-index="${active}"]`);
    if (!menu || !option) return;
    const top = option.offsetTop;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (top + option.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = top + option.offsetHeight - menu.clientHeight;
  }, [open, active]);

  const values = multiple ? String(value).split(',').filter(Boolean) : [];
  const isSelected = index => multiple ? (options[index].value === '' ? values.length === 0 : values.includes(String(options[index].value))) : index === selected;
  const choose = index => {
    const next = String(options[index].value);
    if (multiple) onChange(next === '' ? '' : (values.includes(next) ? values.filter(v => v !== next) : [...values, next]).sort().join(','));
    else { onChange(options[index].value); setOpen(false); }
  };
  function reveal() {
    const bounds = root.current?.getBoundingClientRect();
    if (bounds) {
      const scroller = root.current.closest('.alert-form-scroll')?.getBoundingClientRect();
      const bottomSpace = (scroller?.bottom ?? window.innerHeight) - bounds.bottom - 12;
      const topSpace = bounds.top - (scroller?.top ?? 0) - 12;
      const openAbove = bottomSpace < Math.min(280, options.length * 42 + 14) && topSpace > bottomSpace;
      setAbove(openAbove);
      setMenuHeight(Math.max(84, Math.min(280, openAbove ? topSpace : bottomSpace)));
    }
    keyboardMove.current = true;
    setOpen(true);
  }
  function onKeyDown(event) {
    keyboardMove.current = true;
    const key = event.key;
    if (key === 'Tab') { setOpen(false); return; }
    if (key === 'Escape') { setOpen(false); event.preventDefault(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      if (key === 'Enter' || key === ' ') {
        if (open) choose(active);
        else { setActive(selected); reveal(); }
        return;
      }
      reveal();
      setActive(key === 'Home' ? 0 : key === 'End' ? options.length - 1 :
        Math.max(0, Math.min(options.length - 1, (open ? active : selected) + (key === 'ArrowDown' ? 1 : -1))));
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = Date.now();
      const text = (now - typeahead.current.at < 700 ? typeahead.current.text : '') + key.toLowerCase();
      typeahead.current = { text, at: now };
      const index = options.findIndex(option => option.label.toLowerCase().startsWith(text));
      if (index !== -1) { setActive(index); reveal(); }
    }
  }

  return <div className="rd-filter-select" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <span className="rd-filter-select-label" id={`${id}-label`}>{label}</span>
    <button type="button" className="rd-filter-select-trigger" role="combobox"
      aria-labelledby={`${id}-label ${id}-value`} aria-controls={`${id}-list`}
      aria-haspopup="listbox" aria-expanded={open}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      onKeyDown={onKeyDown} onClick={() => { setActive(selected); if (open) setOpen(false); else reveal(); }}>
      <span id={`${id}-value`}>{multiple && values.length ? `${values.map(v => v === '6' ? '6+' : v).join(', ')} bedrooms` : options[selected].label}</span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.3" /></svg>
    </button>
    {open && <div className={`rd-filter-select-menu${above ? ' opens-above' : ''}`} style={{maxHeight:menuHeight}} id={`${id}-list`} role="listbox" aria-multiselectable={multiple || undefined} aria-labelledby={`${id}-label`}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`}
        role="option" aria-selected={isSelected(index)} data-index={index}
        className={`rd-filter-select-option${index === active ? ' is-active' : ''}`}
        onPointerMove={() => {keyboardMove.current = false;setActive(index);}} onMouseDown={event => event.preventDefault()}
        onClick={() => choose(index)}>
        <span>{option.label}</span><span aria-hidden="true">{isSelected(index) ? '✓' : ''}</span>
      </div>)}
    </div>}
  </div>;
}
