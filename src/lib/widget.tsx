import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { NapsnapWidget, NapsnapWidgetData } from '../widget/NapsnapWidget';
import { WIDGET_DATA_KEY } from '../widget/widgetTaskHandler';

const WIDGET_NAME = 'Napsnap'; // app.json の widgets[].name と一致

// 「友達の最新の今」をウィジェットへ反映（Androidのみ）。
// データを AsyncStorage に保存し（タスクハンドラの再描画用）、即時更新も要求する。
export async function updateNapsnapWidget(data: NapsnapWidgetData): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch {}
  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <NapsnapWidget {...data} />,
      widgetNotFound: () => {},
    });
  } catch {
    // ウィジェット未配置/未対応端末では何もしない。
  }
}
