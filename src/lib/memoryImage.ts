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
  return m ? m[1].toLowerCase() : 'jpg';
}

// 写真ローカルURIを思い出フォルダへコピーし、新しいローカルURIを返す。
// 失敗時は元URIをそのまま返して投稿フローを止めない。
export async function persistMemoryImage(uri: string): Promise<string> {
  try {
    const src = new File(uri);
    if (!src.exists) return uri;
    const dest = new File(memoriesDir(), `${uid('m_')}.${extOf(uri)}`);
    await src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
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
