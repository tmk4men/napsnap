// プライバシーポリシー / 利用規約の本文。ハンバーガーメニューから表示する。
// 端末言語に追従（src/i18n.ts）。ja/en の対で持ち、現在言語の塊を export する。
// ※これは napsnap の方針に沿って用意した雛形。公開前に専門家のレビューを推奨。
import { pick } from './i18n';

export interface LegalDoc {
  title: string;
  updated: string;
  intro?: string;
  sections: { heading: string; body: string }[];
}

const UPDATED = { ja: '2026年5月28日', en: 'May 28, 2026' };

const PRIVACY_POLICY_JA: LegalDoc = {
  title: 'プライバシーポリシー',
  updated: UPDATED.ja,
  intro:
    'napsnap（以下「本サービス」）は、顔や人物を写さず、日常の痕跡をゆるやかに分かち合うためのサービスです。本ポリシーは、本サービスが取得する情報とその扱いについて説明します。',
  sections: [
    {
      heading: '1. 取得する情報',
      body:
        '・プロフィール情報：表示名、ユーザーID（@）、アイコン画像\n・投稿情報：写真、撮影直後の約2秒の環境音、ひとこと（任意）\n・利用情報：フォロー関係、リアクション、足あと（閲覧の記録）\n・端末情報：アプリの動作に必要な最小限の情報',
    },
    {
      heading: '2. 利用目的',
      body:
        '取得した情報は、投稿の表示、相互アンロックや通知などの機能提供、不適切な利用の防止、品質の改善、および広告の表示のために利用します。',
    },
    {
      heading: '3. 保存期間と自動削除',
      body:
        '・通常の投稿（写真・音声）は公開からおおむね24時間で自動的に削除されます。\n・「お題」への投稿は、その日の終わり（翌0時）に削除されます。\n・あなた自身の投稿は「思い出」として、あなたの端末内にのみ残ります。\n・リアクションして「残した」ものは一定時間（おおむね24時間）のみ見返せます。',
    },
    {
      heading: '4. 顔・人物について',
      body:
        '本サービスは顔や人物を主役にしません。投稿前に顔が含まれていないかの確認を行い、顔が検出された写真は投稿できないようにしています。',
    },
    {
      heading: '5. 広告について',
      body:
        '本サービスは、Google AdMob を利用して広告を表示することがあります。広告配信のため、AdMob をはじめとする広告事業者が、広告識別子（端末の広告 ID）やおおまかな利用状況などの情報を取得・利用する場合があります。これらの情報の取り扱いには各広告事業者のプライバシーポリシーが適用されます（例：Google のポリシー https://policies.google.com/privacy ）。\n広告のパーソナライズは、端末の設定（iOS：トラッキングの許可／Android：広告 ID のリセット・オプトアウト）からいつでも無効化できます。',
    },
    {
      heading: '6. 第三者提供',
      body:
        '法令に基づく場合を除き、取得した個人情報を本人の同意なく第三者へ提供することはありません。前項の広告事業者による情報の取得は、各事業者が定める目的の範囲で行われます。',
    },
    {
      heading: '7. 外部サービス',
      body:
        '本サービスは、投稿の保存・配信、表示用のフォントや画像配信などのために外部のサービスを利用することがあります。これらの提供事業者には各社のポリシーが適用されます。',
    },
    {
      heading: '8. 安全管理',
      body: '取得した情報の漏えい・滅失・毀損の防止のため、合理的な安全管理措置を講じます。',
    },
    {
      heading: '9. お問い合わせ',
      body: '本ポリシーに関するお問い合わせは、アプリ内のお問い合わせ窓口またはサポート用の連絡先までご連絡ください。',
    },
    {
      heading: '10. 改定',
      body: '本ポリシーは、必要に応じて改定することがあります。重要な変更がある場合は、アプリ内でお知らせします。',
    },
  ],
};

const PRIVACY_POLICY_EN: LegalDoc = {
  title: 'Privacy Policy',
  updated: UPDATED.en,
  intro:
    'napsnap ("the Service") is a place to gently share the traces of daily life without showing faces or people. This policy explains what information the Service collects and how it is handled.',
  sections: [
    {
      heading: '1. Information we collect',
      body:
        '• Profile info: display name, user ID (@), icon image\n• Post info: photo, about 2 seconds of ambient sound recorded right after the shot, and an optional caption\n• Usage info: follow relationships, reactions, and views (records of viewing)\n• Device info: the minimum needed for the app to function',
    },
    {
      heading: '2. How we use it',
      body:
        'We use the information to display posts, provide features such as mutual unlocking and notifications, prevent misuse, improve quality, and show ads.',
    },
    {
      heading: '3. Retention and auto-deletion',
      body:
        '• Regular posts (photos and audio) are automatically deleted roughly 24 hours after posting.\n• Posts to a "prompt" are deleted at the end of that day (the following midnight).\n• Your own posts remain only on your device as "memories."\n• Items you react to ("kept") can be revisited for a limited time (about 24 hours).',
    },
    {
      heading: '4. About faces and people',
      body:
        'The Service does not make faces or people the focus. Before posting, we check whether a face is included, and photos in which a face is detected cannot be posted.',
    },
    {
      heading: '5. Advertising',
      body:
        'The Service may display ads using Google AdMob. To deliver ads, AdMob and other ad providers may collect and use information such as an advertising identifier (your device\'s ad ID) and general usage. Handling of this information is governed by each ad provider\'s privacy policy (e.g., Google\'s policy: https://policies.google.com/privacy ).\nYou can disable ad personalization at any time in your device settings (iOS: tracking permission / Android: reset or opt out of the ad ID).',
    },
    {
      heading: '6. Sharing with third parties',
      body:
        'Except as required by law, we do not provide your personal information to third parties without your consent. The collection of information by the ad providers above is carried out within the scope each provider defines.',
    },
    {
      heading: '7. External services',
      body:
        'The Service may use external services for storing and delivering posts, and for fonts and image delivery used in display. Each provider\'s own policy applies.',
    },
    {
      heading: '8. Security',
      body: 'We take reasonable security measures to prevent leakage, loss, or damage of the information we collect.',
    },
    {
      heading: '9. Contact',
      body: 'For questions about this policy, please contact us via the in-app contact window or our support contact.',
    },
    {
      heading: '10. Changes',
      body: 'We may revise this policy as needed. If there are significant changes, we will let you know in the app.',
    },
  ],
};

const TERMS_OF_SERVICE_JA: LegalDoc = {
  title: '利用規約',
  updated: UPDATED.ja,
  intro:
    'この利用規約（以下「本規約」）は、napsnap（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。',
  sections: [
    { heading: '1. 適用', body: '本規約は、本サービスの利用に関する一切の関係に適用されます。' },
    {
      heading: '2. アカウント',
      body:
        '利用者は、正確な情報でアカウントを作成し、自己の責任で管理するものとします。なりすましや不正利用が判明した場合、利用を制限することがあります。',
    },
    {
      heading: '3. 禁止事項',
      body:
        '次の行為を禁止します。\n・顔や人物が特定できる写真の投稿\n・他者の権利（肖像・著作・プライバシー等）を侵害する行為\n・誹謗中傷、差別、わいせつ、その他不適切な表現\n・法令または公序良俗に反する行為\n・本サービスの運営を妨げる行為',
    },
    {
      heading: '4. 投稿コンテンツ',
      body:
        '投稿したコンテンツの権利は利用者に帰属します。利用者は、本サービスの提供・表示に必要な範囲で、本サービスがコンテンツを利用することを許諾するものとします。投稿の多くは一定時間で自動的に削除されます。',
    },
    {
      heading: '5. サービスの変更・停止',
      body: '運営上の都合により、本サービスの内容を変更し、または提供を停止・終了することがあります。',
    },
    {
      heading: '6. 免責',
      body:
        '本サービスは、可能な範囲で安定した提供に努めますが、その完全性・正確性・有用性を保証するものではありません。利用者間または第三者との紛争について、本サービスは責任を負いません。',
    },
    {
      heading: '7. 規約の変更',
      body: '本規約は、必要に応じて変更することがあります。変更後に本サービスを利用した場合、変更に同意したものとみなします。',
    },
    { heading: '8. 準拠法', body: '本規約の解釈・適用は、日本法に準拠します。' },
  ],
};

const TERMS_OF_SERVICE_EN: LegalDoc = {
  title: 'Terms of Service',
  updated: UPDATED.en,
  intro:
    'These Terms of Service ("Terms") set out the conditions for using napsnap ("the Service"). By using the Service, you agree to these Terms.',
  sections: [
    { heading: '1. Application', body: 'These Terms apply to all matters relating to use of the Service.' },
    {
      heading: '2. Account',
      body:
        'You must create your account with accurate information and manage it at your own responsibility. If impersonation or misuse is found, we may restrict your use.',
    },
    {
      heading: '3. Prohibited conduct',
      body:
        'The following are prohibited:\n• Posting photos in which a face or person is identifiable\n• Infringing the rights of others (portrait, copyright, privacy, etc.)\n• Defamation, discrimination, obscenity, or other inappropriate expression\n• Conduct that violates laws or public order and morals\n• Conduct that interferes with operation of the Service',
    },
    {
      heading: '4. Posted content',
      body:
        'Rights to content you post belong to you. You grant the Service permission to use your content to the extent necessary to provide and display the Service. Most posts are automatically deleted after a set time.',
    },
    {
      heading: '5. Changes and suspension',
      body: 'For operational reasons, we may change, suspend, or end the Service.',
    },
    {
      heading: '6. Disclaimer',
      body:
        'We strive to provide the Service stably where possible, but do not guarantee its completeness, accuracy, or usefulness. We are not responsible for disputes between users or with third parties.',
    },
    {
      heading: '7. Changes to these Terms',
      body: 'We may change these Terms as needed. If you use the Service after a change, you are deemed to have agreed to it.',
    },
    { heading: '8. Governing law', body: 'These Terms are governed by and interpreted under the laws of Japan.' },
  ],
};

export const PRIVACY_POLICY = pick({ ja: PRIVACY_POLICY_JA, en: PRIVACY_POLICY_EN });
export const TERMS_OF_SERVICE = pick({ ja: TERMS_OF_SERVICE_JA, en: TERMS_OF_SERVICE_EN });
