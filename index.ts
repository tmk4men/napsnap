import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Android：ホーム画面ウィジェットのタスクハンドラを登録（web/iOS では読み込まない）。
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widget/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
