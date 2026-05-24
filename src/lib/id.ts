export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}${t}${rand}`;
}

// 招待コード（人が読み上げ/打ち込みやすい6桁）
export function inviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
