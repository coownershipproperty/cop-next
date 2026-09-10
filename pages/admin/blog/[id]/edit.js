import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  'Properties & Destinations',
  'Co-Ownership Basics',
  'Market Insights',
  'Legal & Finance',
  'Lifestyle & Ownership Experience',
];

function Field({ label, wide = false, children }) {
  return <label className={wide ? 'wide' : ''}><span>{label}</span>{children}</label>;
}

function toForm(post) {
  return {
    title: post.title || '',
    slug: post.slug || '',
    category: post.category || CATEGORIES[0],
    date: post.date || '',
    date_formatted: post.date_formatted || '',
    subtitle: post.subtitle || '',
    excerpt: post.excerpt || '',
    hero_image: post.hero_image || '',
    hero_image_alt: post.hero_image_alt || '',
    hero_image_caption: post.hero_image_caption || '',
    content: post.content || '',
    key_points: JSON.stringify(post.key_points || [], null, 2),
    published: post.published === true,
  };
}

export default function EditBlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState(null);
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch(`/api/admin/blog/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not load the post.');
        if (active) {
          setForm(toForm(payload.post));
          setState('idle');
        }
      } catch (error) {
        if (active) {
          setMessage(error.message);
          setState('error');
        }
      }
    }

    load();
    return () => { active = false; };
  }, [id]);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setState('saving');
    setMessage('');

    let keyPoints;
    try {
      keyPoints = JSON.parse(form.key_points || '[]');
      if (!Array.isArray(keyPoints)) throw new Error();
    } catch (_) {
      setState('error');
      setMessage('At-a-glance points must be a valid JSON array.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.');
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, key_points: keyPoints }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save the post.');
      setForm(toForm(payload.post));
      setState('saved');
      setMessage(payload.warning || 'Changes saved and the public pages have been refreshed.');
    } catch (error) {
      setState('error');
      setMessage(error.message);
    }
  }

  if (!form) {
    return (
      <AdminLayout>
        <Head><title>Edit blog post — COP Admin</title></Head>
        <p className={`blog-editor-loading${state === 'error' ? ' error' : ''}`}>
          {state === 'error' ? message : 'Loading blog post…'}
        </p>
        <style jsx>{styles}</style>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head><title>Edit blog post — COP Admin</title></Head>

      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">EDITORIAL</p>
          <h1>Edit blog post</h1>
          <p>Changes update the live article without a deployment.</p>
        </div>
        <div className="admin-page-actions">
          {form.published && (
            <Link className="admin-secondary-button" href={`/blog/${form.slug}/`} target="_blank">
              View on site ↗
            </Link>
          )}
        </div>
      </div>

      {message && <div className={`blog-editor-notice ${state}`}>{message}</div>}

      <form className="blog-editor-card" onSubmit={save}>
        <div className="blog-editor-grid">
          <Field label="Title" wide>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>

          <Field label="Slug">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required />
          </Field>
          <Field label="Status">
            <select value={form.published ? 'published' : 'draft'} onChange={(e) => set('published', e.target.value === 'published')}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </Field>
          <Field label="Category">
            <input list="blog-categories" value={form.category} onChange={(e) => set('category', e.target.value)} required />
            <datalist id="blog-categories">{CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
          </Field>
          <Field label="Publication date">
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="Display date">
            <input value={form.date_formatted} onChange={(e) => set('date_formatted', e.target.value)} placeholder="10 SEP 2026" />
          </Field>

          <Field label="Standfirst under the title" wide>
            <textarea rows="3" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
          </Field>
          <Field label="Excerpt for blog cards and search" wide>
            <textarea rows="3" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>

          <Field label="Hero image URL" wide>
            <input value={form.hero_image} onChange={(e) => set('hero_image', e.target.value)} />
          </Field>
          <Field label="Hero image alt text" wide>
            <input value={form.hero_image_alt} onChange={(e) => set('hero_image_alt', e.target.value)} />
          </Field>
          <Field label="Hero image caption" wide>
            <textarea rows="2" value={form.hero_image_caption} onChange={(e) => set('hero_image_caption', e.target.value)} />
          </Field>

          <Field label="Content HTML — do not add another H1" wide>
            <textarea className="code" rows="30" value={form.content} onChange={(e) => set('content', e.target.value)} required />
          </Field>
          <Field label="At-a-glance points (JSON, maximum four)" wide>
            <textarea className="code" rows="12" value={form.key_points} onChange={(e) => set('key_points', e.target.value)} />
          </Field>
        </div>

        <div className="blog-editor-actions">
          <Link href={`/blog/${form.slug}/`}>Cancel and view article</Link>
          <button type="submit" disabled={state === 'saving'}>
            {state === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <style jsx>{styles}</style>
    </AdminLayout>
  );
}

const styles = `
  .blog-editor-loading { min-height: 55vh; display: grid; place-items: center; color: #758593; font-size: 14px; }
  .blog-editor-loading.error { color: #a23f3f; }
  .blog-editor-notice { margin-bottom: 16px; padding: 12px 15px; border-radius: 8px; font-size: 12px; font-weight: 700; }
  .blog-editor-notice.saved { color: #21745d; border: 1px solid #bfe4d8; background: #eef9f5; }
  .blog-editor-notice.error { color: #9d3e38; border: 1px solid #efcbc7; background: #fff3f2; }
  .blog-editor-card { overflow: hidden; border: 1px solid #e0e4e5; border-radius: 11px; background: #fff; }
  .blog-editor-grid { padding: 24px; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 17px; }
  .blog-editor-grid label { min-width: 0; display: grid; align-content: start; gap: 7px; color: #526779; font-size: 12px; font-weight: 800; }
  .blog-editor-grid label.wide { grid-column: 1 / -1; }
  .blog-editor-grid input, .blog-editor-grid select, .blog-editor-grid textarea { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid #d6dfe3; border-radius: 7px; color: #263f50; background: #fff; font: 600 13px var(--font-nunito), "Nunito Sans", sans-serif; }
  .blog-editor-grid textarea { resize: vertical; line-height: 1.55; }
  .blog-editor-grid .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; font-weight: 500; }
  .blog-editor-actions { padding: 17px 24px; display: flex; align-items: center; justify-content: flex-end; gap: 16px; border-top: 1px solid #e8ebed; background: #fafbfa; }
  .blog-editor-actions a { color: #607486; font-size: 12px; font-weight: 750; }
  .blog-editor-actions button { min-height: 42px; padding: 0 18px; border-radius: 7px; color: #fff; background: #173f58; font-size: 12px; font-weight: 850; }
  .blog-editor-actions button:disabled { cursor: not-allowed; opacity: .55; }
  @media (max-width: 920px) { .blog-editor-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px) {
    .blog-editor-grid { grid-template-columns: 1fr; padding: 18px; }
    .blog-editor-actions { align-items: stretch; flex-direction: column-reverse; }
    .blog-editor-actions a, .blog-editor-actions button { text-align: center; }
  }
`;
