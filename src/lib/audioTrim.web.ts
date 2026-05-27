// Web 実装：Web Audio API でデコード → 範囲スライス → mono 16bit WAV にエンコード。
// 依存なし。出力は object URL（次回ナビゲーション時に revokeObjectURL する想定だが、
// 1ファイル数十KB の規模なのでリーク許容）。

import type { TrimResult } from './audioTrim';

export async function trimAudio(sourceUri: string, startSec: number, endSec: number): Promise<TrimResult> {
  if (endSec <= startSec) throw new Error('trimAudio: endSec must be > startSec');
  const res = await fetch(sourceUri);
  const ab = await res.arrayBuffer();
  const AudioCtx: typeof AudioContext =
    (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AudioCtx) throw new Error('AudioContext not available');
  const ctx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(ab.slice(0));
  } finally {
    try {
      await ctx.close();
    } catch {}
  }

  const sampleRate = decoded.sampleRate;
  const totalSec = decoded.duration;
  const s = Math.max(0, Math.min(totalSec, startSec));
  const e = Math.max(s, Math.min(totalSec, endSec));
  const startSample = Math.floor(s * sampleRate);
  const endSample = Math.floor(e * sampleRate);
  const lenSamples = Math.max(0, endSample - startSample);

  const ch = decoded.numberOfChannels;
  const mono = new Float32Array(lenSamples);
  for (let c = 0; c < ch; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < lenSamples; i++) mono[i] += data[startSample + i] / ch;
  }

  const wav = encodeWavMono16(mono, sampleRate);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = (globalThis as any).URL?.createObjectURL?.(blob) ?? '';
  return { uri: url, durationMs: Math.round((lenSamples / sampleRate) * 1000), mimeType: 'audio/wav' };
}

function encodeWavMono16(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
