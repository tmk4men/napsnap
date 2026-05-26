import { Platform, Share } from 'react-native';
import { Post } from '../types';

// napsnap の Web デモ公開URL（自分のIDと一緒に他サイトへ貼る用）。
export const NAPSNAP_URL = 'https://tmk4men.github.io/napsnap/';

// 他サイトに貼る招待文。本文（URLなし）と URL を分けて持つ。
export function buildInvite(handle: string): { body: string; url: string; message: string } {
  const id = handle ? `@${handle}` : '';
  const body =
    `napsnap やってる。顔を出さない、24時間で消える日常SNS。\n` +
    (id ? `${id} をさがして、一緒にやろう。` : '一緒にやろう。');
  // クリップボード/ネイティブ用：本文＋URL を1回だけ。
  const message = `${body}\n${NAPSNAP_URL}`;
  return { body, url: NAPSNAP_URL, message };
}

export type ShareResult = 'shared' | 'copied' | 'none';

// 招待文を共有する。Web は OS 共有シート（無ければクリップボードにコピー）、
// ネイティブは標準の共有シート。
export async function shareInvite(handle: string): Promise<ShareResult> {
  const { body, url, message } = buildInvite(handle);

  if (Platform.OS === 'web') {
    const navAny: any = (globalThis as any).navigator;
    if (navAny?.share) {
      try {
        // text には URL を入れない（url と二重になり LINE 等でリンクが2つ出るため）。
        await navAny.share({ title: 'napsnap', text: body, url });
        return 'shared';
      } catch {
        // ユーザーがキャンセル／失敗。クリップボードにフォールバック。
      }
    }
    try {
      if (navAny?.clipboard?.writeText) {
        await navAny.clipboard.writeText(message);
        return 'copied';
      }
    } catch {}
    return 'none';
  }

  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    return 'none';
  }
}

// ============ チェキ（投稿カード）をPNGで書き出して外部シェア ============
// 投稿のチェキを canvas で再構成→PNG→OS共有シート（or ダウンロード）。
// 自分の投稿のシェア用＝SNSへの外部流入経路。napsnapロゴをフッタに焼き込む。
// Web 限定（ネイティブは将来 react-native-view-shot 等で対応）。

export async function shareCheki(post: Post): Promise<ShareResult> {
  if (Platform.OS !== 'web') return 'none'; // ネイティブは未対応
  const blob = await composeChekiPng(post);
  if (!blob) return 'none';
  const file = new (globalThis as any).File([blob], `napsnap-${post.id.slice(0, 8)}.png`, {
    type: 'image/png',
  });
  const navAny: any = (globalThis as any).navigator;
  try {
    if (navAny?.canShare?.({ files: [file] }) && navAny.share) {
      await navAny.share({ files: [file], text: 'napsnap' });
      return 'shared';
    }
  } catch {}
  // フォールバック：ファイルとしてダウンロード
  try {
    const url = URL.createObjectURL(blob);
    const a = (globalThis as any).document.createElement('a');
    a.href = url;
    a.download = `napsnap-${post.id.slice(0, 8)}.png`;
    (globalThis as any).document.body.appendChild(a);
    a.click();
    (globalThis as any).document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'shared';
  } catch {
    return 'none';
  }
}

async function composeChekiPng(post: Post): Promise<Blob | null> {
  const g: any = globalThis;
  const doc = g?.document;
  if (!doc) return null;

  // ChekiCard の比率に合わせる（W=720を基準に）。
  const W = 720;
  const FRAME = Math.round(W * 0.035);
  const photoW = W - FRAME * 2;
  const photoH = Math.round(photoW * 1.12);
  const stripH = Math.round(W * 0.2);
  const cutGap = 4;
  const footerH = 56;
  const totalH = FRAME + photoH + cutGap + stripH + footerH;

  const canvas = doc.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 白い切り抜き（カード全体）
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, totalH);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, totalH - 1);

  // 写真
  try {
    const img = await loadImageForCanvas(post.imageUrl);
    ctx.drawImage(img, FRAME, FRAME, photoW, photoH);
  } catch {
    // 失敗時はダーク埋め（最悪でも書き出しは止めない）
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(FRAME, FRAME, photoW, photoH);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.strokeRect(FRAME + 0.5, FRAME + 0.5, photoW - 1, photoH - 1);

  // 切り取り線
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(FRAME, FRAME + photoH + cutGap, photoW, 1);

  // キャプション（あれば）
  const stripY = FRAME + photoH + cutGap;
  if (post.caption?.text) {
    const fontSize = Math.max(20, Math.round(W * 0.06));
    ctx.fillStyle = post.caption.color || '#0F0F0F';
    ctx.font = `800 ${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(post.caption.text, W / 2, stripY + stripH / 2 - 6);
  }

  // 日付
  const d = new Date(post.createdAt);
  ctx.fillStyle = '#9C9C9C';
  ctx.font = '500 20px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${d.getMonth() + 1}.${d.getDate()}`, W - FRAME - 6, stripY + stripH - 12);

  // フッタ：napsnap ロゴ
  ctx.fillStyle = '#0F0F0F';
  ctx.font = '800 28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('napsnap', W / 2, totalH - footerH / 2);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b: Blob | null) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    );
  }).catch(() => null);
}

function loadImageForCanvas(uri: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const g: any = globalThis;
    const img = new g.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = uri;
  });
}
