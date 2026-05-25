import { Platform } from 'react-native';

// 投稿前の顔検知。
// - Web: MediaPipe Tasks Vision(FaceDetector) を CDN から実行時ロードして静止画を解析。
//   顔が見つかったら投稿をブロックする。
// - ネイティブ(本番): ここでは 0 を返す（ブロックしない）。本番は react-native-vision-camera /
//   ML Kit など端末側の検知に差し替える前提。
const WEB = Platform.OS === 'web';
const VER = '0.10.18';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

let libPromise: Promise<any> | null = null;
let detectorPromise: Promise<any> | null = null;
let videoDetectorPromise: Promise<any> | null = null;

// CDN の ESM を inline module script で読み込む（Metro のバンドルを経由しない）。
function loadLib(): Promise<any> {
  if (libPromise) return libPromise;
  libPromise = new Promise((resolve, reject) => {
    const g: any = globalThis;
    if (!g?.document) return reject(new Error('no document'));
    if (g.__napFace) return resolve(g.__napFace);
    g.addEventListener('napface-ready', () => resolve(g.__napFace), { once: true });
    const s = g.document.createElement('script');
    s.type = 'module';
    s.textContent =
      `import { FaceDetector, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}';` +
      `window.__napFace = { FaceDetector, FilesetResolver };` +
      `window.dispatchEvent(new Event('napface-ready'));`;
    s.onerror = () => reject(new Error('mediapipe load failed'));
    g.document.head.appendChild(s);
  });
  return libPromise;
}

async function getDetector(): Promise<any> {
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    const { FaceDetector, FilesetResolver } = await loadLib();
    const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
    });
  })();
  return detectorPromise;
}

// ライブ映像用（VIDEO モード）の検知器。静止画用とは別インスタンス。
async function getVideoDetector(): Promise<any> {
  if (videoDetectorPromise) return videoDetectorPromise;
  videoDetectorPromise = (async () => {
    const { FaceDetector, FilesetResolver } = await loadLib();
    const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });
  })();
  return videoDetectorPromise;
}

// カメラ起動時に動画検知器を先読み（Webのみ）。
export function preloadVideoDetector() {
  if (!WEB) return;
  getVideoDetector().catch(() => {});
}

// ライブの <video> 要素から顔の数を返す（撮影前のシャッター制御用）。検知不能時は 0。
export async function detectFacesInVideo(video: any, tsMs: number): Promise<number> {
  if (!WEB || !video) return 0;
  try {
    if (video.readyState < 2 || !video.videoWidth) return 0; // まだ描画前
    const d = await getVideoDetector();
    const res = d.detectForVideo(video, tsMs);
    return res?.detections?.length ?? 0;
  } catch {
    return 0;
  }
}

function loadImage(uri: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const g: any = globalThis;
    const img = new g.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = uri;
  });
}

export interface FaceResult {
  ok: boolean; // 検知を実行できたか（false=モデル読込/解析に失敗）
  faces: number; // 検知できた顔の数
}

// カメラ起動時などに先読みしてプレビューでの待ち時間を減らす（Webのみ・失敗は無視）。
export function preloadDetector() {
  if (!WEB) return;
  getDetector().catch(() => {});
}

// 顔検知。ok=true は実行できた（faces で判定）、ok=false は実行できず（＝判定不能）。
// ネイティブ本番は端末側に差し替える前提で、ここでは ok:true / faces:0（=素通り）。
export async function detectFaces(uri: string): Promise<FaceResult> {
  if (!WEB) return { ok: true, faces: 0 };
  try {
    const detector = await getDetector();
    const img = await loadImage(uri);
    const res = detector.detect(img);
    return { ok: true, faces: res?.detections?.length ?? 0 };
  } catch {
    return { ok: false, faces: 0 };
  }
}
