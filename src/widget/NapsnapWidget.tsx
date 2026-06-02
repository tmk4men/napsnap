import React from 'react';
import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';

// ホーム画面ウィジェット（Android）。フォロー中の友達の最新の“今”を1枚表示する（Locket型）。
// データは widgetTaskHandler が AsyncStorage から読んで渡す。タップでアプリを開く。
export interface NapsnapWidgetData {
  imageUrl?: string;
  handle?: string;
  stamp?: string; // 例 6.2 12:05
}

export function NapsnapWidget({ imageUrl, handle, stamp }: NapsnapWidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FDFBF7',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
      }}
    >
      {imageUrl ? (
        <OverlapWidget style={{ height: 'match_parent', width: 'match_parent', borderRadius: 12 }}>
          <ImageWidget
            image={imageUrl as `https:${string}`}
            imageWidth={400}
            imageHeight={400}
            radius={12}
            style={{ height: 'match_parent', width: 'match_parent' }}
          />
          {/* 下部に半透明の帯＋@IDと時刻 */}
          <FlexWidget
            style={{
              height: 'match_parent',
              width: 'match_parent',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
            }}
          >
            <FlexWidget
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: 'match_parent',
                backgroundColor: '#00000066',
                paddingHorizontal: 8,
                paddingVertical: 5,
              }}
            >
              <TextWidget text={handle ? `@${handle}` : 'napsnap'} style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' }} />
              {!!stamp && (
                <TextWidget text={`   ${stamp}`} style={{ fontSize: 11, color: '#EAEAEA' }} />
              )}
            </FlexWidget>
          </FlexWidget>
        </OverlapWidget>
      ) : (
        <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget text="napsnap" style={{ fontSize: 20, color: '#0F0F0F', fontWeight: 'bold' }} />
          <TextWidget text="友達の“今”がここに出る" style={{ fontSize: 11, color: '#8A8A8A', marginTop: 4 }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
