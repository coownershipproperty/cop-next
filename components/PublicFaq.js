import { useId, useState } from 'react';
import styles from '@/styles/public-editorial.module.css';

export function PublicFaqSection({ children, id }) {
  return <section id={id} className={styles.faqSection}><div className={styles.faqInner}>{children}</div></section>;
}

export default function PublicFaq({ items, htmlAnswers = false }) {
  const [open, setOpen] = useState(null);
  const id = useId();
  return <div className={styles.faqList}>
    {items.map((item, index) => {
      const expanded = open === index;
      const triggerId = `${id}-trigger-${index}`;
      const panelId = `${id}-panel-${index}`;
      return <div className={styles.faqItem} key={index}>
        <h3 className={styles.questionHeading}>
          <button type="button" className={styles.question} id={triggerId}
            aria-expanded={expanded} aria-controls={panelId}
            onClick={() => setOpen(expanded ? null : index)}>
            <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.questionText}>{item.q}</span>
            <svg className={styles.chevron} data-open={expanded} aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </h3>
        <div className={styles.answer} id={panelId} aria-labelledby={triggerId} hidden={!expanded}>
          {htmlAnswers ? <div dangerouslySetInnerHTML={{ __html: item.a }} /> : <p>{item.a}</p>}
        </div>
      </div>;
    })}
  </div>;
}
