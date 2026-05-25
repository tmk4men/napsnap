# napsnap を3人で試運用する（Supabase 無料 ＋ 配布）

いまのアプリは**ローカルのモック**（サーバ無し）。3人で投稿を共有するには共有バックエンドが要る。
ここまでで**コード側の足場は用意済み**：`src/lib/supabase.ts`（クライアント）、`src/lib/backend.ts`（データ操作）、
`supabase/schema.sql`（DB/RLS/ストレージ）、`src/config.ts`（鍵の読み込み）。
**鍵が未設定なら従来どおりモックで動く**ので、GitHub Pages のデモは今のまま壊れない。

---

## 1. Supabase（無料）を用意する　← あなたの操作

1. https://supabase.com で無料アカウント → **New project**（リージョンは Tokyo 推奨）。
2. 左メニュー **SQL Editor** → `supabase/schema.sql` の中身を貼って **Run**（テーブル・RLS・`media` バケットが作られる）。
3. **Authentication → Providers → Anonymous** を **ON**（端末ごとに匿名ログイン。メール不要で試せる）。
4. **Project Settings → API** から2つをコピー：
   - **Project URL**
   - **anon public** key（クライアント埋め込み前提の公開鍵。データは RLS で守られる）
5. プロジェクト直下に `.env` を作成（`.env.example` をコピー）：
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

> これで `hasSupabase=true` になり、バックエンドが有効化される。

---

## 2. アプリのデータ層を Supabase に繋ぐ　← 次にこちらでやる作業（鍵が要る）

`store.ts` の各操作を `src/lib/backend.ts` の関数に置き換える（対応は1:1で用意済み）：

| store の操作 | backend の関数 |
|---|---|
| 起動時のサインイン | `ensureSession()` |
| `completeAccountSetup` / `updateProfile` | `upsertMyProfile()` |
| `toggleFollow` | `follow()` / `unfollow()` / `listFollowing()` |
| `addPost`（画像/音声アップロード込み） | `addPost()`（内部で `uploadMedia()`） |
| フィード取得 | `listActivePosts()` / `listMyPosts()` |
| `reactToPost` / `reactToTopic` | `react()` |
| `markViewed` | `markViewed()` |
| 反応/足跡の取得 | `listReactions()` / `listViews()` |

`feedState`・`accessPass`・検索履歴・既読時刻は**端末ローカルUI状態**なので AsyncStorage のまま（サーバには載せない）。
モック専用ロジック（`makeFollowPosts` 等の自動投稿生成、`scheduleEngagement` の擬似反応、`refresh*IfStale`）は
実データでは不要になるので、`hasSupabase` のときはスキップする。

**この差し替えは、あなたの鍵が入った状態で実機テストしながら行うのが安全**（今は鍵が無く実通信を検証できないため未着手）。
鍵を `.env` に入れて教えてくれたら、ここを仕上げる。

---

## 3. 3人のスマホに配る（無料の現実解）

- **Android（一番ラク・PC不要）**: 無料の **EAS preview build**（APK）。内部配布リンクから各自インストール。
  ```
  npm i -g eas-cli && eas login
  eas build:configure
  eas build -p android --profile preview   # 出来たAPKリンクを3人に送る
  ```
- **iOS（完全無料の範囲）**: **Expo Go ＋ トンネル**（あなたのPCを起動中だけ）。
  ```
  npx expo start --tunnel                  # 出たQR/リンクを Expo Go で開く
  ```
  ※ iOS で PC 不要にするには TestFlight が要り、Apple Developer（$99/年）が必要＝無料ではない。
- **とりあえず見た目だけ**: いまの Web デモ（GitHub Pages）。インストール不要だが iOS Safari のカメラ/音声はやや不安定。

> 補足: EAS Update（OTA配信）は **Expo Go では動かず**、dev/preview ビルドが必要。なので「PC不要で配る」は上の preview build が実質の無料解（Android）。

---

## 無料枠の目安（3人なら十分）
- DB 500MB / ストレージ 1GB / 認証 5万MAU / 帯域 5GB。
- 注意: 1週間アクセスが無いと無料プロジェクトは一時停止 → ダッシュボードで再開すれば戻る。
- 画像は投稿前に `compressForStore` で縮小済み＝転送量を節約。
