// 端末の言語に自動追従する超軽量 i18n。起動時に1回だけ lang を決める（theme と同じ方針）。
// 日本語端末＝'ja'、それ以外＝'en'（英語を国際フォールバックにする）。
import * as Localization from 'expo-localization';

export type Lang = 'ja' | 'en';

function detect(): Lang {
  try {
    const code = Localization.getLocales?.()[0]?.languageCode ?? 'ja';
    return code === 'ja' ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
}

export const lang: Lang = detect();

// ja/en の対を受け取り、現在の言語の文字列を返す。
export function tr(ja: string, en: string): string {
  return lang === 'en' ? en : ja;
}

// 言語ごとの辞書から現在言語の塊を取り出すヘルパ。
export function pick<T>(byLang: { ja: T; en: T }): T {
  return byLang[lang];
}
