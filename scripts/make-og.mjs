// napsnap の OGP 画像（1200x630）を生成して public/og.png に出力する。
// SNS シェア時のカード用。デザイン＝白地 × 黒（Twitter/Instagram のようなモノクロ）＋号外の罫線/題字。
// 実行: node scripts/make-og.mjs   （フォントは system の Noto Sans/Serif CJK JP を使用）
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/og.png');

const JP = "'Noto Sans CJK JP','DejaVu Sans',sans-serif";
const SERIF = "'Noto Serif CJK JP','DejaVu Serif',serif"; // 題字＝明朝/セリフ
const MONO = "'DejaVu Sans Mono','Noto Sans CJK JP',monospace";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- 地：白 -->
  <rect width="1200" height="630" fill="#FFFFFF"/>

  <!-- 左：マストヘッド風コピー -->
  <g>
    <!-- 題字 -->
    <text x="84" y="150" font-family="${SERIF}" font-size="96" font-weight="700" letter-spacing="-4" fill="#0F0F0F">napsnap</text>
    <!-- 二重罫（太→細） -->
    <rect x="84" y="178" width="660" height="6" fill="#0F0F0F"/>
    <rect x="84" y="192" width="660" height="2" fill="#0F0F0F"/>

    <!-- 大見出し（詰めた明朝） -->
    <text x="80" y="330" font-family="${SERIF}" font-size="104" font-weight="700" letter-spacing="-4" fill="#0F0F0F">顔のない、</text>
    <text x="80" y="446" font-family="${SERIF}" font-size="104" font-weight="700" letter-spacing="-4" fill="#0F0F0F">今日の痕跡。</text>

    <!-- サブ（等幅で日付伝票っぽく） -->
    <text x="86" y="520" font-family="${MONO}" font-size="26" fill="#5B5B5B">撮ると6時間みんなが見えて、24時間で消える。</text>
  </g>

  <!-- 右：端末モック（白黒） -->
  <g>
    <rect x="800" y="60" width="330" height="510" rx="52" fill="#000000"/>
    <rect x="816" y="78" width="298" height="474" rx="38" fill="#FFFFFF"/>
    <clipPath id="screen"><rect x="816" y="78" width="298" height="474" rx="38"/></clipPath>
    <g clip-path="url(#screen)">
      <!-- ミニ題字＋罫線 -->
      <text x="842" y="138" font-family="${SERIF}" font-size="30" font-weight="700" letter-spacing="-1" fill="#0F0F0F">napsnap</text>
      <rect x="842" y="150" width="246" height="3" fill="#0F0F0F"/>

      <!-- チェキ（白の切り抜き＋細い黒罫＋グレーの写真） -->
      <g transform="rotate(-2 965 320)">
        <rect x="858" y="188" width="214" height="250" fill="#FFFFFF" stroke="#0F0F0F" stroke-opacity="0.85" stroke-width="1.5"/>
        <rect x="868" y="198" width="194" height="196" fill="#DADADA"/>
        <rect x="868" y="404" width="194" height="1" fill="#0F0F0F" opacity="0.18"/>
      </g>

      <!-- 黒のCTAバー -->
      <rect x="842" y="468" width="246" height="52" rx="2" fill="#111111"/>
      <text x="965" y="501" text-anchor="middle" font-family="${JP}" font-size="22" font-weight="700" fill="#FFFFFF">撮ってひらく</text>
    </g>
    <!-- Dynamic Island -->
    <rect x="918" y="96" width="94" height="22" rx="11" fill="#000000"/>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK JP' },
  background: '#FFFFFF',
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, resvg.render().asPng());
console.log('wrote', OUT);
