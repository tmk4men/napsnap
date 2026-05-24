// napsnap の OGP 画像（1200x630）を生成して public/og.png に出力する。
// SNS シェア時のカード用。デザイン＝クリーム背景 × ライム差し色 × 端末モック。
// 実行: node scripts/make-og.mjs   （フォントは system の Noto Sans CJK JP を使用）
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/og.png');

const JP = "'Noto Sans CJK JP','DejaVu Sans',sans-serif";
const LATIN = "'DejaVu Sans','Noto Sans CJK JP',sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFBEF"/>
      <stop offset="0.55" stop-color="#FFF3D8"/>
      <stop offset="1" stop-color="#FBEAC9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#D9F74A" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#D9F74A" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="screenClip"><rect x="806" y="84" width="292" height="476" rx="40"/></clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="965" cy="320" r="300" fill="url(#glow)"/>

  <!-- 左：コピー -->
  <g>
    <rect x="88" y="118" width="236" height="46" rx="23" fill="#D9F74A" stroke="#181A0D" stroke-opacity="0.10"/>
    <circle cx="116" cy="141" r="6" fill="#181A0D"/>
    <text x="132" y="149" font-family="${JP}" font-size="22" font-weight="700" fill="#181A0D">顔なし写真SNS</text>

    <text x="84" y="312" font-family="${LATIN}" font-size="138" font-weight="700" letter-spacing="-5" fill="#171713">napsnap</text>

    <text x="90" y="384" font-family="${JP}" font-size="40" font-weight="700" fill="#5C5648">顔のない、今日の痕跡。</text>

    <text x="90" y="446" font-family="${JP}" font-size="26" fill="#8C8676">撮ると、6時間みんなが見える。</text>
    <text x="90" y="486" font-family="${JP}" font-size="26" fill="#8C8676">24時間で、ぜんぶ消える。</text>
  </g>

  <!-- 右：端末モック -->
  <g>
    <rect x="790" y="66" width="324" height="508" rx="54" fill="#0E0E0B" stroke="#FFFFFF" stroke-opacity="0.06"/>
    <rect x="806" y="84" width="292" height="476" rx="40" fill="#FFF8E8"/>
    <g clip-path="url(#screenClip)">
      <!-- ステータス的なミニブランド -->
      <text x="834" y="150" font-family="${LATIN}" font-size="19" font-weight="700" letter-spacing="3" fill="#171713">napsnap</text>
      <!-- 痕跡マーク -->
      <g stroke="#D8CFBC" stroke-width="3" stroke-linecap="round">
        <line x1="1012" y1="156" x2="1028" y2="140"/>
        <line x1="1020" y1="166" x2="1044" y2="142"/>
        <line x1="1034" y1="172" x2="1050" y2="156"/>
      </g>
      <circle cx="1050" cy="134" r="4.5" fill="#B7CB52"/>

      <!-- 見出し -->
      <text x="834" y="310" font-family="${JP}" font-size="52" font-weight="700" fill="#171713">今日の</text>
      <text x="834" y="372" font-family="${JP}" font-size="52" font-weight="700" fill="#171713">痕跡。</text>

      <!-- ライムのCTAチップ -->
      <rect x="834" y="468" width="190" height="48" rx="24" fill="#D9F74A"/>
      <circle cx="860" cy="492" r="6" fill="#181A0D"/>
      <text x="876" y="500" font-family="${JP}" font-size="20" font-weight="700" fill="#181A0D">撮ると、見える</text>
    </g>
    <!-- Dynamic Island -->
    <rect x="906" y="102" width="92" height="22" rx="11" fill="#08080a"/>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK JP' },
  background: '#FFF8E8',
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, resvg.render().asPng());
console.log('wrote', OUT);
