export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

export function now(): number {
  return Date.now();
}

export function isActive(expiresAt: number): boolean {
  return expiresAt > Date.now();
}

// 次の0時（ローカル）のタイムスタンプ。お題の投稿は日付がかわると同時に消すため、
// 24h ではなく「今日の終わり」を期限にする。
export function nextMidnight(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function remainingMs(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

// 「あと5時間12分」「あと48分」「まもなく終了」
export function formatRemaining(expiresAt: number): string {
  const ms = remainingMs(expiresAt);
  if (ms <= 0) return '終了';
  const totalMin = Math.floor(ms / MINUTE);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `あと${h}時間${m}分`;
  if (m > 0) return `あと${m}分`;
  return 'まもなく終了';
}

// 残り時間をコンパクトに（タイマー用）「5:12」
export function formatClock(expiresAt: number): string {
  const ms = remainingMs(expiresAt);
  const totalMin = Math.floor(ms / MINUTE);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// 「たった今」「3分前」「2時間前」
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MINUTE) return 'たった今';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}分前`;
  return `${Math.floor(diff / HOUR)}時間前`;
}
