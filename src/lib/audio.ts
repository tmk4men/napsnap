import { Platform } from 'react-native';
import { Post } from '../types';

// シャッター押下直後に録音する秒数（企画の新仕様）
export const RECORD_SECONDS = 2;

// --- デモ用の環境音生成 ---------------------------------------------------
// バックエンドが無いため、モック友達の投稿には合成した環境音（やわらかいノイズ）を
// その場で生成して付ける。実音声ファイルを持ち回らずに「音が鳴る体験」を再現する。
// 生成は Web 限定（HTMLAudioElement が data URI WAV を再生できる）。ネイティブでは音なし。

const AMBIENT_SECONDS = 1.4; // ループ前提なので短め
const SAMPLE_RATE = 8000;

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function base64FromBytes(bytes: Uint8Array): string {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += table[(n >> 18) & 63] + table[(n >> 12) & 63] + table[(n >> 6) & 63] + table[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += table[(n >> 18) & 63] + table[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += table[(n >> 18) & 63] + table[(n >> 12) & 63] + table[(n >> 6) & 63] + '=';
  }
  return out;
}

function writeStr(view: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}

// シードからやわらかいブラウンノイズ風の WAV を作って data URI を返す
function makeAmbientWavDataUri(seed: string): string {
  const rand = mulberry32(hashSeed(seed));
  const total = Math.floor(AMBIENT_SECONDS * SAMPLE_RATE);
  const dataBytes = total * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  // ブラウンノイズ（白色ノイズを積分してリーク）＋端をフェードしてループの継ぎ目を緩和
  let last = 0;
  const amp = 1600; // 控えめな音量（int16 範囲は ±32767）
  const fade = Math.floor(total * 0.08);
  for (let i = 0; i < total; i++) {
    const white = rand() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    let env = 1;
    if (i < fade) env = i / fade;
    else if (i > total - fade) env = (total - i) / fade;
    const s = Math.max(-1, Math.min(1, last * 8)) * env;
    view.setInt16(44 + i * 2, s * amp, true);
  }

  return 'data:audio/wav;base64,' + base64FromBytes(new Uint8Array(buffer));
}

const ambientCache = new Map<string, string>();

// 投稿から再生用の音源を解決する。録音済みなら実音声、モックならデモ環境音(Web限定)。
export function resolvePostAudioSource(post?: Post | null): string | null {
  if (!post) return null;
  if (post.audioUrl) return post.audioUrl;
  if (post.audioSeed && Platform.OS === 'web') {
    let cached = ambientCache.get(post.audioSeed);
    if (!cached) {
      cached = makeAmbientWavDataUri(post.audioSeed);
      ambientCache.set(post.audioSeed, cached);
    }
    return cached;
  }
  return null;
}

export function postHasSound(post?: Post | null): boolean {
  if (!post) return false;
  if (post.audioUrl) return true;
  return !!post.audioSeed && Platform.OS === 'web';
}
