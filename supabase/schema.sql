-- napsnap Supabase スキーマ。Supabase の SQL Editor に貼って上から実行する。
-- 認証は Supabase Auth（匿名サインイン推奨：Authentication → Providers → Anonymous を ON）。
-- 各テーブルは RLS で「本人」と「フォロー関係」に限定。共有が要るのは下の5テーブルのみ。
-- （feedState / accessPass / 検索履歴 / 既読時刻 は端末ローカルUI状態なのでサーバには持たない）

-- ============ profiles（= アプリの User）============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null default '',
  avatar_url text,
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ follows ============
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);

-- ============ posts ============
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  topic_key  text,                 -- お題への投稿ならそのキー（topics.ts）
  image_url  text not null,
  caption    jsonb,                -- { text, fontKey, color, x, y }
  audio_url  text,                 -- シャッター時の2.5秒
  created_at timestamptz not null default now(),
  expires_at timestamptz not null  -- 通常=24h後 / お題=その日の終わり
);
create index if not exists posts_user_idx    on public.posts(user_id);
create index if not exists posts_expires_idx on public.posts(expires_at);

-- ============ reactions（1人1投稿につき1つ）============
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,        -- love / lol / whoa
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists reactions_post_idx on public.reactions(post_id);

-- ============ views（足跡。1人1投稿につき1つ）============
create table if not exists public.views (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references public.posts(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (post_id, viewer_id)
);
create index if not exists views_post_idx on public.views(post_id);

-- ============ push_tokens（段階2：プッシュ通知の宛先）============
-- 端末ごとの Expo push トークン。送信側（Edge Function）は service role で他人ぶんも読む。
create table if not exists public.push_tokens (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
create index if not exists push_tokens_user_idx on public.push_tokens(user_id);

-- ============ RLS 有効化 ============
alter table public.profiles  enable row level security;
alter table public.follows   enable row level security;
alter table public.posts     enable row level security;
alter table public.reactions enable row level security;
alter table public.views     enable row level security;
alter table public.push_tokens enable row level security;

-- profiles: 誰でも読める（検索/表示）。作成・更新は自分の行のみ。
drop policy if exists profiles_read   on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- follows: 自分が関わる行だけ読める。作成/削除は follower=自分のみ。
drop policy if exists follows_read   on public.follows;
create policy follows_read   on public.follows for select using (follower_id = auth.uid() or following_id = auth.uid());
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert with check (follower_id = auth.uid());
drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows for delete using (follower_id = auth.uid());

-- posts: 自分＋フォロー中の人の投稿だけ読める。作成/削除は本人のみ。
drop policy if exists posts_read   on public.posts;
create policy posts_read   on public.posts for select using (
  user_id = auth.uid()
  or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = posts.user_id)
);
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (user_id = auth.uid());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (user_id = auth.uid());

-- reactions: 見える投稿への反応は読める。作成/更新/削除は本人のみ。
drop policy if exists reactions_read   on public.reactions;
create policy reactions_read   on public.reactions for select using (
  exists (select 1 from public.posts p where p.id = reactions.post_id and (
    p.user_id = auth.uid()
    or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.user_id)
  ))
);
drop policy if exists reactions_insert on public.reactions;
create policy reactions_insert on public.reactions for insert with check (user_id = auth.uid());
drop policy if exists reactions_update on public.reactions;
create policy reactions_update on public.reactions for update using (user_id = auth.uid());
drop policy if exists reactions_delete on public.reactions;
create policy reactions_delete on public.reactions for delete using (user_id = auth.uid());

-- views: 自分の足跡＋自分の投稿への足跡だけ読める。作成は本人のみ。
drop policy if exists views_read   on public.views;
create policy views_read   on public.views for select using (
  viewer_id = auth.uid()
  or exists (select 1 from public.posts p where p.id = views.post_id and p.user_id = auth.uid())
);
drop policy if exists views_insert on public.views;
create policy views_insert on public.views for insert with check (viewer_id = auth.uid());

-- push_tokens: 本人だけ自分のトークンを読み書き（送信側の Edge Function は service role で跨ぐ）。
drop policy if exists push_tokens_rw on public.push_tokens;
create policy push_tokens_rw on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ Storage（画像/音声を1つの公開バケット media に）============
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;
-- 公開読み取り（URLを埋め込むため）。アップロードは認証ユーザーが自分のフォルダ <uid>/... のみ。
drop policy if exists media_read   on storage.objects;
create policy media_read   on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ 期限切れ投稿の自動掃除（DBを膨らませない肝）============
-- 方針：思い出（過去の自分の投稿）は端末ローカルにのみ保存する。
-- よってサーバーは「期限切れの投稿は全部消す」でよい。
-- 投稿を消せば、足あと(views)・反応(reactions) は上の on delete cascade で一緒に消える
-- ＝ いちばん量が出る views が24h分しか残らず、DBが線形に膨らまない。
--
-- pg_cron 拡張が必要（Supabase: Database → Extensions → pg_cron を ON）。
-- 下を Supabase の SQL Editor で1回実行するとスケジュール登録される（15分おき）。
create extension if not exists pg_cron;

-- 掃除本体：①期限切れ投稿のメディア本体（画像/音声）を storage から削除 →
-- ②投稿行を削除（views / reactions は on delete cascade で連動削除）。
-- image_url/audio_url は公開URL。'/media/' 以降が storage.objects.name に一致する。
-- storage.objects を消すため security definer（所有ロール権限）で実行する。
create or replace function public.napsnap_prune_expired()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
  using public.posts p
  where p.expires_at < now()
    and o.bucket_id = 'media'
    and o.name in (
      split_part(p.image_url, '/media/', 2),
      split_part(coalesce(p.audio_url, ''), '/media/', 2)
    );

  delete from public.posts where expires_at < now();
end;
$$;

-- 二重登録を避けてから登録（再実行しても安全に）。
select cron.unschedule('napsnap-prune-expired')
  where exists (select 1 from cron.job where jobname = 'napsnap-prune-expired');
select cron.schedule(
  'napsnap-prune-expired',
  '*/15 * * * *',
  $$ select public.napsnap_prune_expired() $$
);

-- ============ 段階2: プッシュ通知の配線 ============
-- 送信ロジックは Edge Function（supabase/functions/send-push）。
-- 投稿(posts) / 反応(reactions) の INSERT を pg_net で叩いて起動する＝Dashboard の
-- Webhook 機能と同じ仕組みを SQL で直書きしたもの（操作1回で完結・再現性あり）。
--
-- 事前準備:
--   1) Edge Function をデプロイ:  supabase functions deploy send-push --project-ref <REF>
--      （SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Edge Function に自動注入）
--   2) 下の SQL の <PROJECT_REF> と <ANON_KEY> を置換して SQL Editor で実行
--      ・<PROJECT_REF> ＝ Supabase の Project Ref（例: zpmjykujiycmyvolewys）
--      ・<ANON_KEY>    ＝ Settings → API → anon public（クライアントJSに埋まる公開JWT）
--        ※ 公開キー前提なので、function 本体に書き込んでも権限漏洩にはならない
--          （RLS 範囲＝ふつうのクライアントが叩けるのと同じ）。
create extension if not exists pg_net;

create or replace function public.napsnap_notify_push()
returns trigger language plpgsql security definer as $plpgsql$
begin
  perform net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body := jsonb_build_object('type','INSERT','table',TG_TABLE_NAME,'record',to_jsonb(NEW))
  );
  return NEW;
end;
$plpgsql$;

drop trigger if exists napsnap_push_posts on public.posts;
create trigger napsnap_push_posts after insert on public.posts
  for each row execute function public.napsnap_notify_push();

drop trigger if exists napsnap_push_reactions on public.reactions;
create trigger napsnap_push_reactions after insert on public.reactions
  for each row execute function public.napsnap_notify_push();
