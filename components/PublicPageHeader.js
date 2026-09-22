import { Children, cloneElement, isValidElement } from 'react';
import styles from '@/styles/public-editorial.module.css';

/** Shared editorial header. Copy, links and metadata remain owned by the page. */
export default function PublicPageHeader({ children, ...props }) {
  return <header {...props} className={styles.header}>
    <div className={styles.headerInner}>
      {Children.map(children, child => {
        if (!isValidElement(child)) return child;
        const previous = child.props.className || '';
        const kind = child.type === 'h1' ? 'title'
          : previous.includes('eyebrow') ? 'eyebrow'
          : previous.includes('meta') ? 'meta' : 'lead';
        return cloneElement(child, {
          className: `${styles[kind]}${child.type === 'h1' ? ' compare-h1' : ''}`,
          style: undefined,
        });
      })}
    </div>
  </header>;
}
