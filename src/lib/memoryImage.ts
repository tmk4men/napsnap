// ネイティブ：投稿写真を「思い出」として端末の永続領域（documentDirectory）へ複製する。
// 圧縮直後の元ファイルは expo-image-manipulator のキャッシュ領域にあり、OS のストレージ逼迫で
// 消され得る。サーバーも24hで元メディアを削除するため、思い出はここに複製して長期保持する。
import { Directory, File, Paths } from 'expo-file-system';
import { uid } from './id';

const DIR = 'memories';

function memoriesDir(): Directory {
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extOf(uri: string): string {
  const m = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const e = m ? m[1].toLowerCase() : 'jpg';
  // 拡張子が画像っぽくなければ jpg に寄せる（リモートURLでクエリ付き等）。
  return /^(jpg|jpeg|png|webp|gif|heic|heif)$/.test(e) ? e : 'jpg';
}

// 端末ローカル（documentDirectory 配下の memories）に既に在るファイルか。
export function isLocalMemoryUri(uri?: string): boolean {
  if (!uri) return false;
  return uri.includes(`/${DIR}/`) && uri.startsWith('file');
}

// 写真ローカルURIを思い出フォルダへコピーし、新しいローカルURIを返す。
// 失敗時は元URIをそのまま返して投稿フローを止めない。
// uri がリモート（http/https）の場合はダウンロードして保存する。
export async function persistMemoryImage(uri: string): Promise<string> {
  // 既に思い出フォルダのファイルなら何もしない（多重コピー防止）。
  if (isLocalMemoryUri(uri)) return uri;
  // リモートURLはダウンロードで保存（古い投稿の復元バックフィル用）。
  if (/^https?:\/\//.test(uri)) {
    const local = await downloadMemoryImage(uri);
    return local ?? uri;
  }
  try {
    const src = new File(uri);
    if (!src.exists) return uri;
    const dest = new File(memoriesDir(), `${uid('m_')}.${extOf(uri)}`);
    src.copySync(dest);
    // コピー結果を検証。出来ていなければ元URIにフォールバック。
    return dest.exists ? dest.uri : uri;
  } catch {
    return uri;
  }
}

// リモートURLの画像を思い出フォルダへダウンロードして永続保存する。
// 成功でローカルURI、失敗で undefined。
export async function downloadMemoryImage(url: string): Promise<string | undefined> {
  try {
    const dest = new File(memoriesDir(), `${uid('m_')}.${extOf(url)}`);
    const out = await File.downloadFileAsync(url, dest, { idempotent: true });
    const localUri = out?.uri ?? dest.uri;
    const f = new File(localUri);
    return f.exists ? f.uri : undefined;
  } catch {
    return undefined;
  }
}

// 1枚の思い出写真を端末ローカルから削除する（投稿削除時）。memoryUri が無い／既に消えていても素通し。
export function deleteMemoryImage(uri?: string): void {
  if (!isLocalMemoryUri(uri)) return; // ローカルの思い出ファイルだけ消す（リモートURL等は無視）。
  try {
    const f = new File(uri!);
    if (f.exists) f.delete();
  } catch {
    // 失敗しても無視（残っても害は無い）
  }
}

// 退会／デモリセット時の後片付け。思い出フォルダごと消す（残っても害は無いが容量節約）。
export async function clearMemoryImages(): Promise<void> {
  try {
    const dir = new Directory(Paths.document, DIR);
    if (dir.exists) dir.delete();
  } catch {
    // 失敗しても無視（次回起動でも問題ない）
  }
}
