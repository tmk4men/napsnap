// 広告オフ（ADS_ENABLED=false）で出すため、AdMob SDK が自動付与する広告ID権限を取り除く。
// これが残っていると Play の「広告ID＝使用しない」申告と矛盾し、審査でブロックされる。
// 広告を再開するときは、この plugin を app.json の plugins から外して再ビルドする。
const { withAndroidManifest } = require('expo/config-plugins');

const AD_ID_PERMS = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
];

module.exports = function withRemoveAdIdPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const perm of AD_ID_PERMS) {
      // 既存の付与を消し、tools:node="remove" を1つ入れる＝マージ後の最終manifestから除去される。
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (p) => p?.$?.['android:name'] !== perm
      );
      manifest['uses-permission'].push({ $: { 'android:name': perm, 'tools:node': 'remove' } });
    }
    return cfg;
  });
};
