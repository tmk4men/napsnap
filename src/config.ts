// バックエンド設定。Expo の EXPO_PUBLIC_* 環境変数から読む（ビルド時にインライン化される）。
// 鍵が無いとき（= GitHub Pages のデモ等）は hasSupabase=false となり、アプリは従来どおり
// ローカルのモックで動く。3人トライアル用ビルドでだけ .env に鍵を入れて有効化する。
//
// 使い方（プロジェクトルートに .env を作成。コミットしない＝.gitignore 済み）:
//   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   ← anon public key（クライアント埋め込み前提・RLSで保護）

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// バックエンドを使うか（鍵が両方そろっているときだけ true）。
export const hasSupabase = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// ストレージのバケット名（schema.sql と一致させる）。
export const MEDIA_BUCKET = 'media';

// 広告のオン/オフ（全広告の元栓）。false の間は AdMob SDK を初期化せず、
// バナー/スライド/リワードを一切出さない＝広告IDも収集しない（Play「広告なし」で申告できる）。
// 収益化を始めるときは true に戻し、src/lib/ads.ts の PROD_* に本番AdMobユニットIDを埋める。
// （[[napsnap-ad-strategy]] / [[napsnap-avatar-ad-gate]]）
export const ADS_ENABLED = false;

// napsnap 公式アカウントの user id（Supabase 上の固定アカウント）。
// 新規ユーザーは起動時に必ずこの人をフォロー＝最初から feed に公式の投稿が出る（未投稿ならモザイク）。
export const OFFICIAL_USER_ID = '491b161c-e0e2-49ce-a47f-731cc9584476';
