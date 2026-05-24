// napsnap データモデル（企画書 6章）。MVP はローカル/モック先行のため全てクライアント保持。

export type ReactionType = 'saw' | 'lol' | 'feel' | 'whoa' | 'love' | 'nap';

export interface User {
  id: string;
  handle: string; // @ユーザーID（人が決める）
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  createdAt: number;
  isMock?: boolean; // デモ用のモックの人
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  groupId?: string; // 旧グループ概念の名残（フォローモデルでは未使用）
  imageUrl: string;
  // シャッター押下直後に録音した2.5秒の音声。自分の投稿は録音URI。
  audioUrl?: string;
  // モック友達投稿用：デモ環境音をシードから生成するための種（Webでのみ鳴る）。
  audioSeed?: string;
  createdAt: number;
  expiresAt: number; // createdAt + 24h
}

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
