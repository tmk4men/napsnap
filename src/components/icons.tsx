import React from 'react';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
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
  whoa: BoltIcon,
  // 旧データ用フォールバック（現在は未使用の種類）
  saw: SmileIcon,
  feel: SmileIcon,
  nap: BoltIcon,
};

export function ReactionIcon({ type, size = 24, color }: { type: ReactionType } & IconProps) {
  const Cmp = REACTION_ICONS[type] ?? HeartIcon;
  return <Cmp size={size} color={color} />;
}

export function ClockTime({ size = 13, color = colors.lime }: IconProps) {
  return <ClockIcon size={size} color={color} />;
}

export { G };
