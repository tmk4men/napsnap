// デモ用の「生活の痕跡」画像。バックエンドが無いため、安定して取得できる
// picsum.photos のシード付きURLを使う（顔なし保証ではなく、あくまで体験確認用）。

export function lifeImage(seed: string | number): string {
  return `https://picsum.photos/seed/napsnap-${seed}/700/900`;
}

// モック友達の投稿に使う痕跡のバリエーション（机・飯・足元・寝床…のイメージ）
export const TRACE_SEEDS = [
  'desk',
  'meal',
  'feet',
  'bed',
  'coffee',
  'door',
  'bag',
  'floor',
  'hand',
  'window',
  'lazy',
  'night',
];

// カメラが使えない環境（権限拒否など）でも投稿フローを体験するためのデモ写真
export function demoCapture(): string {
  const seed = `me-${Math.floor(Math.random() * 100000)}`;
  return lifeImage(seed);
}

// napsnap公式の「お手本」カード用の写真。毎回ランダムだと体験がブレるので、
// 固定の数枚プールから1枚だけランダムで選ぶ（中身を入れ替えたいときはここを編集）。
export const OFFICIAL_PHOTO_SEEDS = [
  'official-still-1',
  'official-still-2',
  'official-still-3',
  'official-still-4',
  'official-still-5',
] as const;

export function officialPhotoSeed(): string {
  return OFFICIAL_PHOTO_SEEDS[Math.floor(Math.random() * OFFICIAL_PHOTO_SEEDS.length)];
}

// プロフィール画像（正方形）。顔なしの世界観に合う「痕跡」をプリセットにする。
export function avatarImage(seed: string | number): string {
  return `https://picsum.photos/seed/napsnap-av-${seed}/240/240`;
}

// アカウント作成時に選べるプリセット写真アバター（机・湯気・布・窓・植物・足元…）。
export const AVATAR_SEEDS = [
  'mug',
  'linen',
  'plant',
  'window',
  'paper',
  'steam',
  'shoe',
  'lamp',
] as const;

export const PRESET_AVATARS = AVATAR_SEEDS.map((s) => avatarImage(s));
