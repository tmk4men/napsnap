// napsnap データモデル（企画書 6章）。MVP はローカル/モック先行のため全てクライアント保持。

export type ReactionType = 'saw' | 'lol' | 'feel' | 'whoa' | 'love' | 'nap';

export interface User {
  id: string;
  handle: string; // @ユーザーID（人が決める）
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  avatarImageUri?: string; // プロフィール画像（選んだ写真／プリセット）。あれば表示の主役。
  createdAt: number;
  isMock?: boolean; // デモ用のモックの人
  isOfficial?: boolean; // napsnap 公式アカウント（最初からフォロー・初期フィードを供給・認証バッジ）
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: number;
}

// 画像に入れる文字（投稿前にユーザーが付ける）。焼き込みではなく表示時にオーバーレイする。
export interface PostCaption {
  text: string;
  fontKey: string; // CAPTION_FONTS のキー
  color: string; // 文字色
  x: number; // 文字中心の水平位置（0..1）
  y: number; // 文字中心の垂直位置（0..1）
}

export interface Post {
  id: string;
  userId: string;
  groupId?: string; // 旧グループ概念の名残（フォローモデルでは未使用）
  topicKey?: string; // 「お題」への投稿ならそのお題キー（topics.ts）。ホーム/残すには出さない別世界。
  imageUrl: string;
  // 「思い出」用に端末へ複製した写真のローカルURI（自分の通常投稿のみ）。
  // サーバーには送らない／載せない。サーバーが24hで元メディアを消しても残るよう、
  // 投稿時にローカルへコピーして保持する。表示時は memoryUri を優先する。
  memoryUri?: string;
  caption?: PostCaption;
  // シャッター押下直後に録音した2.5秒の音声。自分の投稿は録音URI。
  audioUrl?: string;
  // モック友達投稿用：デモ環境音をシードから生成するための種（Webでのみ鳴る）。
  audioSeed?: string;
  createdAt: number;
  expiresAt: number; // createdAt + 24h
  // 反応数／足あと数のサーバ側集計（DBトリガで維持）。表示用。reactions/views 全行を引かなくて済む。
  reactionCount?: number;
  viewCount?: number;
  // お題投稿の公開範囲。'public'=全実在ユーザーに見える / 'followers'=自分とフォロワーだけ。
  // 通常投稿（topicKey なし）には適用されない。
  topicVisibility?: TopicVisibility;
  // 「号外」：1週間ぶんの自分の投稿を綴じてフォロワーのホームに流す（24h で消える）。
  // kind='issue' のとき issue が必ず入る。imageUrl は1枚目（表紙）と同じURLを入れて既存表示と互換にする。
  // kind='ad' はクライアントが縦スワイプに差し込む広告スライドの目印（サーバーには存在しない合成投稿）。
  kind?: 'photo' | 'issue' | 'ad';
  issue?: {
    label: string; // 例: "5月 第3号"
    images: string[]; // 綴じた週の投稿の画像URL配列（時系列）
    sourcePostIds: string[]; // 元の投稿ID（参照用）
  };
}

export type TopicVisibility = 'public' | 'followers';

// 通知の種類（アクティビティ一覧に出すかどうかをユーザーが個別にオンオフできる）。
// follow=フォローされた / react=自分の投稿に反応 / post=他人の新規投稿 / view=自分の投稿が見られた / topic=お題が更新された
export type NotifyKind = 'follow' | 'react' | 'post' | 'view' | 'topic';
export type NotifyPrefs = Record<NotifyKind, boolean>;

export interface ViewRecord {
  id: string;
  postId: string;
  viewerId: string;
  viewedAt: number;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string; // 反応した人
  type: ReactionType;
  createdAt: number;
}

// 自分（currentUser）が各投稿をどう処理したか。企画書では unseen/viewed/skipped/reacted。
// napsnap では「表示＝足跡(View)」「進む＝skip か react」なので feedState は skipped/reacted のみ保持する。
export type FeedStatus = 'skipped' | 'reacted';

export interface FeedState {
  postId: string;
  status: FeedStatus;
  updatedAt: number;
}

export interface AccessPass {
  openedAt: number;
  expiresAt: number; // openedAt + 6h
}
