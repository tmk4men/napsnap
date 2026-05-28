// Windows ローカルビルド対策。
// expo-modules-core の `generateStubPCH` タスクは、clang++ に渡す Windows パスを
// String.replaceAll の置換文字列に使っており、バックスラッシュがエスケープ扱いで消える
// （例: C:\dev\napsnap\... → C:devnapsnap...）。結果 Gradle Sync が失敗する。
// このタスクは IDE の C++ sync を通すための補助で、実ビルドの PCH は ninja が別途生成するため、
// 無効化しても AAB/APK のビルド結果には影響しない。macOS/Linux では発生しないが、無効化は無害。
const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = 'napsnap:disable-generateStubPCH';
const SNIPPET = `
// ${MARKER} — generateStubPCH breaks on Windows backslash paths; only an IDE C++ sync helper.
allprojects {
    tasks.matching { it.name == "generateStubPCH" }.configureEach { it.enabled = false }
}
`;

module.exports = function withDisableExpoStubPch(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents += SNIPPET;
    return cfg;
  });
};
