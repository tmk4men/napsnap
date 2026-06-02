// Windows ローカルビルド対策（非ASCIIパス）。
// プロジェクトが OneDrive\デスクトップ 配下にあり、パスに日本語（非ASCII）が含まれるため、
// Android Gradle Plugin のパスチェックがビルドを停止させる
//   "Your project path contains non-ASCII characters..."
// このフラグでチェックを無効化する。expo prebuild のたびに gradle.properties が
// 再生成されてフラグが消えるのを防ぐため、config plugin で毎回付与する。
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'android.overridePathCheck';

module.exports = function withAndroidOverridePathCheck(config) {
  return withGradleProperties(config, (cfg) => {
    const has = cfg.modResults.find((i) => i.type === 'property' && i.key === KEY);
    if (!has) {
      cfg.modResults.push({
        type: 'property',
        key: KEY,
        value: 'true',
      });
    }
    return cfg;
  });
};
