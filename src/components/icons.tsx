import React from 'react';
import Svg, { Circle, Ellipse, Path, Line, G } from 'react-native-svg';
import { ReactionType } from '../types';
import { colors } from '../theme';

type IconProps = { size?: number; color?: string };

// --- リアクション（3種） ---
export function HeartIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
      />
    </Svg>
  );
}

export function SmileIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={8.5} y1={10} x2={8.5} y2={10.5} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={15.5} y1={10} x2={15.5} y2={10.5} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M8 14c1.2 1.6 2.6 2.3 4 2.3s2.8-.7 4-2.3" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function BoltIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 2L4 14h6l-1 8 9-13h-6l1-7z" fill={color} />
    </Svg>
  );
}

// 「やば」＝👀（目）
export function EyesIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx={7.6} cy={12} rx={3.7} ry={4.7} stroke={color} strokeWidth={1.8} fill="none" />
      <Ellipse cx={16.4} cy={12} rx={3.7} ry={4.7} stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={8.9} cy={12.6} r={1.7} fill={color} />
      <Circle cx={17.7} cy={12.6} r={1.7} fill={color} />
    </Svg>
  );
}

// --- 時計（残り時間用） ---
export function ClockIcon({ size = 14, color = colors.lime }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={12} y1={12} x2={12} y2={7.5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={12} x2={15.5} y2={13.5} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// --- スピーカー ---
export function SpeakerOnIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={color} />
      <Path d="M16.5 8.5a5 5 0 0 1 0 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M19 6a8 8 0 0 1 0 12" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function SpeakerOffIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={color} />
      <Line x1={16} y1={9} x2={21} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={21} y1={9} x2={16} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// --- カメラ ---
export function CameraIcon({ size = 22, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 7h3l1.4-2h7.2L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

// --- タブ：ホーム（窓＝今をのぞく） ---
export function WindowIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5z"
        stroke={color}
        strokeWidth={1.9}
        fill="none"
        strokeLinejoin="round"
      />
      <Line x1={12} y1={4.5} x2={12} y2={19.5} stroke={color} strokeWidth={1.9} />
      <Line x1={3.5} y1={12} x2={20.5} y2={12} stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

// --- タブ：残した（しおり） ---
export function BookmarkIcon({ size = 24, color = colors.text, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15.2a.6.6 0 0 1-.95.49L12 16.7l-5.55 4a.6.6 0 0 1-.95-.49V5A1.5 1.5 0 0 1 7 3.5z"
        stroke={color}
        strokeWidth={1.9}
        fill={filled ? color : 'none'}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- 編集（鉛筆） ---
export function PencilIcon({ size = 14, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 16.5L15.5 5l3.5 3.5L7.5 20H4v-3.5z"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- 写真を選ぶ（画像） ---
export function ImageIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.9}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={8.5} cy={9.5} r={1.6} fill={color} />
      <Path d="M3.5 17l4.5-4.5 3.5 3.5 3-3L20.5 17" stroke={color} strokeWidth={1.9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// --- カレンダー ---
export function CalendarIcon({ size = 22, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 6h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.9}
        fill="none"
        strokeLinejoin="round"
      />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={1.9} />
      <Line x1={8} y1={3.5} x2={8} y2={6.5} stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Line x1={16} y1={3.5} x2={16} y2={6.5} stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

// --- 文字（Aa） ---
export function TextIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18L8 6l5 12M4.6 14.2h6.8" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.5 11.2a2.7 2.7 0 0 0-4.6 1.9c0 1.5 1.2 2.6 2.7 2.6 1 0 1.6-.4 1.9-1V18" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- 左右シェブロン（カレンダーの月送り） ---
export function ChevronLeftIcon({ size = 20, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- 空状態の抽象マーク（生活の“痕跡”＝短い斜線＋1点） ---
export function TraceMark({ size = 44, color = colors.line, dot = colors.limeDust }: IconProps & { dot?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Line x1={8} y1={28} x2={20} y2={16} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={16} y1={32} x2={32} y2={16} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={26} y1={34} x2={36} y2={24} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={34} cy={12} r={3} fill={dot} />
    </Svg>
  );
}

// --- 反応せず流す（下向き） ---
export function ChevronDownIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const REACTION_ICONS: Record<ReactionType, (p: IconProps) => React.JSX.Element> = {
  love: HeartIcon,
  lol: SmileIcon,
  whoa: EyesIcon,
  // 旧データ用フォールバック（現在は未使用の種類）
  saw: SmileIcon,
  feel: SmileIcon,
  nap: EyesIcon,
};

export function ReactionIcon({ type, size = 24, color }: { type: ReactionType } & IconProps) {
  const Cmp = REACTION_ICONS[type] ?? HeartIcon;
  return <Cmp size={size} color={color} />;
}

export function ClockTime({ size = 13, color = colors.lime }: IconProps) {
  return <ClockIcon size={size} color={color} />;
}

export { G };
