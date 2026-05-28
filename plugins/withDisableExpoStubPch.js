// Windows ローカルビルド対策。
// expo-modules-core の `generateStubPCH` タスクは、clang++ に渡す Windows パスを
// String.replaceAll の置換文字列に使うため、バックスラッシュがエスケープ扱いで消える
// （C:\dev\... → C:dev...）→ Gradle Sync が失敗する。
// このタスクは IDE の C++ sync 補助で、実ビルドの PCH は ninja が別途生成するため、
// 無効化しても AAB/APK には影響しない。macOS/Linux では無害（そもそも出ない）。
//
// 注意: CMake の PCH 自体（実ビルド側の cmake_pch.hxx.pch 読み込み失敗）は Windows で別途壊れるが、
// それは expo-modules-core/android/build.gradle の cppArguments に
// -DCMAKE_DISABLE_PRECOMPILE_HEADERS=ON を入れて対処する（node_modules 直パッチ or patch-package）。
// ここで afterEvaluate / externalNativeBuild をいじると「already evaluated」で落ちるので触らない。
const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = 'napsnap:disable-generateStubPCH';
const SNIPPET = `
// ${MARKER} — generateStubPCH breaks on Windows backslash paths; only an IDE C++ sync helper.
allprojects { proj ->
    proj.tasks.matching { it.name == "generateStubPCH" }.configureEach { it.enabled = false }
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
