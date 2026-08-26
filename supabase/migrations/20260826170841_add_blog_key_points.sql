alter table public.posts
  add column if not exists key_points jsonb;

comment on column public.posts.key_points is
  'Optional ordered array of up to four editorial summary points shown below the hero image.';

alter table public.posts
  drop constraint if exists posts_key_points_is_array;

alter table public.posts
  add constraint posts_key_points_is_array
  check (
    key_points is null
    or (
      jsonb_typeof(key_points) = 'array'
      and jsonb_array_length(key_points) <= 4
    )
  );
