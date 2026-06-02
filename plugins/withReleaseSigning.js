// Play 提出用のリリース署名を Gradle に設定する。
// android/keystore.properties（gitignore＝コミットされないローカル専用）から
// 鍵情報を読み、release ビルドに適用する。これにより Android Studio の
// 「Generate Signed Bundle」ダイアログ（毎回パスワード白紙）を使わず、
// `gradlew bundleRelease` で Play 提出用 AAB を生成できる。
// keystore.properties が無い場合は debug 署名にフォールバック（CI/他環境で評価が落ちないように）。
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'napsnap:release-signing';
const SNIPPET = `
// ${MARKER}
android {
    signingConfigs {
        release {
            def kpFile = rootProject.file('keystore.properties')
            if (kpFile.exists()) {
                def kp = new Properties()
                kpFile.withInputStream { kp.load(it) }
                storeFile file(kp.getProperty('storeFile'))
                storePassword kp.getProperty('storePassword')
                keyAlias kp.getProperty('keyAlias')
                keyPassword kp.getProperty('keyPassword')
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents += SNIPPET;
    return cfg;
  });
};
