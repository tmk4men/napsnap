// napsnap の Google Play フィーチャーグラフィック（1024x500）を生成して store/feature-graphic.png に出力する。
// デザイン＝確定の号外（新聞紙面）× 白黒。題字の真ん中の s だけ薄い黄緑(#D6E66B)のワンポイント。
// 透過なしの不透明PNG（background指定）＝Play要件「24-bit PNG (no alpha) / JPEG」を満たす。
// 実行: node scripts/make-feature.mjs   （フォントは system の Noto Sans/Serif CJK JP を使用）
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../store/feature-graphic.png');

const JP = "'Noto Sans CJK JP','DejaVu Sans',sans-serif";
const SERIF = "'Noto Serif CJK JP','DejaVu Serif',serif"; // 題字＝明朝/セリフ
const MONO = "'DejaVu Sans Mono','Noto Sans CJK JP',monospace";
const INK = '#0F0F0F';
const LIME = '#D6E66B'; // brandAccent（theme.ts と同じ）

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <!-- 地：白 -->
  <rect width="1024" height="500" fill="#FFFFFF"/>

  <!-- 左：マストヘッド＋大見出し -->
  <g>
    <!-- 題字（nap + s(アクセント) + nap） -->
    <text x="70" y="118" font-family="${SERIF}" font-size="64" font-weight="700" letter-spacing="-3" fill="${INK}">nap<tspan fill="${LIME}">s</tspan>nap</text>
    <!-- 二重罫（太→細） -->
    <rect x="72" y="138" width="430" height="6" fill="${INK}"/>
    <rect x="72" y="150" width="430" height="2" fill="${INK}"/>

    <!-- 大見出し（詰めた明朝） -->
    <text x="66" y="268" font-family="${SERIF}" font-size="78" font-weight="700" letter-spacing="-3" fill="${INK}">顔のない、</text>
    <text x="66" y="356" font-family="${SERIF}" font-size="78" font-weight="700" letter-spacing="-3" fill="${INK}">今日の痕跡。</text>

    <!-- サブ（等幅で日付伝票っぽく） -->
    <text x="70" y="420" font-family="${MONO}" font-size="23" fill="#5B5B5B">撮ると6時間みんなが見えて、24時間で消える。</text>
  </g>

  <!-- 右：端末モック（白黒） -->
  <g>
    <rect x="724" y="34" width="276" height="432" rx="44" fill="#000000"/>
    <rect x="738" y="50" width="248" height="400" rx="32" fill="#FFFFFF"/>
    <clipPath id="screen"><rect x="738" y="50" width="248" height="400" rx="32"/></clipPath>
    <g clip-path="url(#screen)">
      <!-- ミニ題字＋罫線 -->
      <text x="760" y="104" font-family="${SERIF}" font-size="26" font-weight="700" letter-spacing="-1" fill="${INK}">nap<tspan fill="${LIME}">s</tspan>nap</text>
      <rect x="760" y="116" width="204" height="3" fill="${INK}"/>

      <!-- チェキ（白の切り抜き＋細い黒罫＋グレーの写真） -->
      <g transform="rotate(-2 862 268)">
        <rect x="768" y="146" width="188" height="222" fill="#FFFFFF" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.5"/>
        <rect x="778" y="156" width="168" height="170" fill="#DADADA"/>
        <rect x="778" y="334" width="168" height="1" fill="${INK}" opacity="0.18"/>
      </g>

      <!-- 黒のCTAバー -->
      <rect x="760" y="392" width="204" height="46" rx="2" fill="#111111"/>
      <text x="862" y="421" text-anchor="middle" font-family="${JP}" font-size="20" font-weight="700" fill="#FFFFFF">撮ってひらく</text>
    </g>
    <!-- Dynamic Island -->
    <rect x="822" y="66" width="80" height="20" rx="10" fill="#000000"/>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1024 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK JP' },
  background: '#FFFFFF',
});
const rendered = resvg.render();
const { width, height, pixels } = rendered; // pixels = RGBA バッファ

// Play 要件「24-bit PNG (no alpha)」に合わせ、白地に合成してアルファを落とす（colorType 2）。
const png = new PNG({ width, height, colorType: 2 });
for (let i = 0; i < pixels.length; i += 4) {
  const a = pixels[i + 3] / 255;
  png.data[i] = Math.round(pixels[i] * a + 255 * (1 - a));
  png.data[i + 1] = Math.round(pixels[i + 1] * a + 255 * (1 - a));
  png.data[i + 2] = Math.round(pixels[i + 2] * a + 255 * (1 - a));
  png.data[i + 3] = 255;
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, PNG.sync.write(png, { colorType: 2 }));
console.log('wrote', OUT);
