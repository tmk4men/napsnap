import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NapsnapWidget, NapsnapWidgetData } from './NapsnapWidget';

// アプリが書き込む「最新の友達の今」。lib/widget.tsx の WIDGET_DATA_KEY と一致させる。
export const WIDGET_DATA_KEY = 'napsnap_widget_latest';

async function readLatest(): Promise<NapsnapWidgetData> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw);
    return { imageUrl: d.imageUrl, handle: d.handle, stamp: d.stamp };
  } catch {
    return {};
  }
}

// ウィジェットの追加/更新/リサイズ時に、保存済みの最新データで描画する。
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await readLatest();
      props.renderWidget(<NapsnapWidget {...data} />);
      break;
    }
    case 'WIDGET_CLICK':
      // clickAction="OPEN_APP" がアプリ起動を担うのでここでは何もしない。
      break;
    default:
      break;
  }
}
