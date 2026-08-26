alter table public.posts
  add column if not exists hero_image_alt text,
  add column if not exists hero_image_caption text;

comment on column public.posts.hero_image_alt is
  'Concise replacement text describing the hero image for screen readers and search engines.';

comment on column public.posts.hero_image_caption is
  'Optional editorial caption displayed directly beneath the hero image.';
