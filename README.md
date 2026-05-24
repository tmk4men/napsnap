# napsnap

> **1枚出すと6時間ひらく、顔なし日常SNS。**

顔や人を映さず、生活の痕跡（机・飯・足元・寝床…）を共有する少人数SNS。
1枚投稿すると6時間だけ友達の投稿がひらき、1枚ずつ一方通行で見て、反応したものだけが24時間残る。

企画の全文は [`docs/企画書.md`](docs/企画書.md)。

---

## いまの状態

- **Phase 1（最小SNS）= 実装済み**：オンボーディング / グループ作成・参加 / 写真投稿 / 24時間表示 / 6時間閲覧パス / ロック画面 / 一方通行フィード / リアクション / 残したタブ / 自分タブ（足跡・反応）
- バックエンドは**ローカル/モック先行**。AsyncStorage（Webでは localStorage）に保存し、グループ作成時にモック友達（みほ・たくや・けん・さき）と投稿をシードして核ループを再現する。
- 自分が投稿すると、モック友達が数秒かけて足跡・リアクションを残す演出付き（「自分」タブで確認できる）。
- **Phase 2 以降は未実装**：人検知（顔検知シャッター無効）、プッシュ通知、実バックエンド。

Expo SDK 56 / React Native 0.85 / TypeScript。1つのコードベースで iOS・Android・Web に対応。

---

## ブラウザで使用感を確認する（GitHub Pages デモ）

このリポジトリには `.github/workflows/deploy.yml` があり、`main`/`master` に push すると
Expo の Web 書き出しを **GitHub Pages** に自動公開する。

1. GitHub にこのリポジトリを push する
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
3. push（または Actions タブから手動実行）すると、数分後に `https://<ユーザー名>.github.io/napsnap/` で開ける

> **重要**：公開URLのサブパスは `app.json` の `experiments.baseUrl`（現在 `"/napsnap"`）に依存する。
> リポジトリ名を `napsnap` 以外にする場合は、その値を `"/<リポジトリ名>"` に変更すること。

---

## ローカルで動かす

```bash
npm install

# ブラウザでプレビュー（開発サーバー。baseUrl は付かない）
npm run web

# スマホ実機（Expo Go アプリでQRを読む）
npm start

# 本番と同じ静的書き出し（dist/ に出力）
npm run export:web

# 型チェック
npm run typecheck
```

カメラ権限を許可しない環境（PCブラウザなど）でも、カメラ画面の「デモ写真で」から投稿フローを体験できる。

---

## 触ってみる流れ

1. オンボーディング3枚 → 名前を入れる
2. 「グループを作る」or 招待コードで「参加する」（モック友達が入る）
3. ホームは **LOCKED**。「今を撮る」で1枚出す
4. 出すと **OPEN**（6時間）。そのままフィードへ
5. 1枚ずつ表示。リアクションすると「残した」へ、`↓ 反応せず流す`（または上下スワイプ）で消える
6. 「自分」タブで足跡とリアクションを確認（誰がスルーしたかは出ない）
7. 「自分」タブ下部からデモのリセット・グループ退出ができる

---

## 構成

```
App.tsx                      ルート（レスポンシブ枠 + ナビゲーション）
src/
  theme.ts / copy.ts         配色・余白・全UI文言（企画書のトーン）
  types.ts                   データモデル
  store.ts                   zustand + AsyncStorage 永続化 + 核ロジック
  selectors.ts               フィード/残した/自分 の派生データ
  seed.ts / lib/             モック友達・画像・時刻・ID
  components/                ボタン・アバター・リアクションバー・端末枠
  screens/                   各画面
  navigation/                タブ・オーバーレイ管理（URLルーティングは使わない）
docs/企画書.md               企画書
.github/workflows/deploy.yml GitHub Pages 自動公開
```

ナビゲーションはURLルーティングを使わず状態で管理しているため、Web書き出しは単一の `index.html`（SPA）になり GitHub Pages に置きやすい。
