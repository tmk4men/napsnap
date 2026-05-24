// expo export 後に dist/index.html へ OGP / Twitter Card / description を注入する。
// Expo(Router未使用)の Metro web ではHTML headを直接いじれないため、書き出し後に後注入する。
// 実行: node scripts/inject-ogp.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.resolve(__dirname, '../dist/index.html');

// 公開先（GitHub Pages）。リポジトリ名/ユーザー名が変わったらここを直す。
const SITE_URL = process.env.SITE_URL || 'https://tmk4men.github.io/napsnap';
const IMAGE = `${SITE_URL}/og.png`;
const TITLE = 'napsnap — 顔のない、今日の痕跡。';
const DESC =
  '顔を出さない写真SNS。机・ごはん・足元…今日の“痕跡”を1枚。撮ると6時間みんなが見えて、24時間で消える。';

if (!fs.existsSync(HTML)) {
  console.error('dist/index.html が見つからない。先に `expo export --platform web` を実行して。');
  process.exit(1);
}

let html = fs.readFileSync(HTML, 'utf8');

if (html.includes('<!-- ogp:start -->')) {
  console.log('OGP は注入済み。スキップ。');
  process.exit(0);
}

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;800;900&family=Yomogi&family=Zen+Maru+Gothic:wght@500;700&family=Shippori+Mincho:wght@600;800&display=swap';

const tags = `  <!-- ogp:start -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link id="napsnap-fonts" rel="stylesheet" href="${FONTS_HREF}" />
    <meta name="description" content="${DESC}" />
    <meta name="theme-color" content="#FFF8E8" />
    <link rel="canonical" href="${SITE_URL}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="napsnap" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:image" content="${IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${TITLE}" />
    <meta property="og:locale" content="ja_JP" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESC}" />
    <meta name="twitter:image" content="${IMAGE}" />
    <!-- ogp:end -->
`;

// より見栄えのよいタブタイトルに差し替え（無ければそのまま）
html = html.replace(/<title>.*?<\/title>/, `<title>${TITLE}</title>`);
// </head> の直前にタグを差し込む
html = html.replace('</head>', `${tags}  </head>`);

fs.writeFileSync(HTML, html);
console.log('OGP を dist/index.html に注入した。');
