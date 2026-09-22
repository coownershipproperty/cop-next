import styles from '@/styles/public-editorial.module.css';

export default function PublicArticleBody({ children, ...props }) {
  return <section {...props} className={styles.body}>{children}</section>;
}
