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

// BlazeFace は丸い物体（カップ・皿・果物・電灯…）に対して 0.5 でも高スコアを返しがち。
// 静止画(投稿前ブロック)は強めに（0.78）、ライブ(シャッター無効化)はやや控えめ（0.72）。
// 数値は検証で詰める：低すぎると誤検出、高すぎると小さい横顔を見逃す。
const FACE_CONF_IMAGE = 0.78;
const FACE_CONF_VIDEO = 0.72;
// 小さい誤検出（カップの蓋・遠くのライト等）を除く＝フレーム短辺に対する顔の最小比率。
// 自撮り距離の顔は短辺 15% 以上を占めるのが普通。
const MIN_FACE_RATIO = 0.13;

async function getDetector(): Promise<any> {
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    const { FaceDetector, FilesetResolver } = await loadLib();
    const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: 'IMAGE',
      minDetectionConfidence: FACE_CONF_IMAGE,
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
      minDetectionConfidence: FACE_CONF_VIDEO,
    });
  })();
  return videoDetectorPromise;
}

// 検出結果から「顔として扱う」ものだけを残す：信頼度＋短辺比率でフィルタ。
function countValidFaces(detections: any[], frameW: number, frameH: number, minConf: number): number {
  if (!detections?.length) return 0;
  const minSide = Math.min(frameW, frameH) * MIN_FACE_RATIO;
  let n = 0;
  for (const d of detections) {
    const score = d?.categories?.[0]?.score ?? 0;
    const bbox = d?.boundingBox;
    if (!bbox) continue;
    if (score < minConf) continue;
    const w = bbox.width ?? 0;
    const h = bbox.height ?? 0;
    if (Math.min(w, h) < minSide) continue;
    n++;
  }
  return n;
}

// カメラ起動時に動画検知器を先読み（Webのみ）。
export function preloadVideoDetector() {
  if (!WEB) return;
  getVideoDetector().catch(() => {});
}

// ライブの <video> 要素から顔の数を返す（撮影前のシャッター制御用）。検知不能時は 0。
// 信頼度＋最小サイズで誤検出（丸い物体）を除外する。
export async function detectFacesInVideo(video: any, tsMs: number): Promise<number> {
  if (!WEB || !video) return 0;
  try {
    if (video.readyState < 2 || !video.videoWidth) return 0; // まだ描画前
    const d = await getVideoDetector();
    const res = d.detectForVideo(video, tsMs);
    return countValidFaces(res?.detections ?? [], video.videoWidth, video.videoHeight, FACE_CONF_VIDEO);
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
    const w = img.naturalWidth ?? img.width ?? 0;
    const h = img.naturalHeight ?? img.height ?? 0;
    return { ok: true, faces: countValidFaces(res?.detections ?? [], w, h, FACE_CONF_IMAGE) };
  } catch {
    return { ok: false, faces: 0 };
  }
}
