import ExpoModulesCore
import AVFoundation

// 音声ファイルを [startSec, endSec] に切り出す iOS 実装。
// AVAssetExportSession を使うので追加依存はなし。出力は m4a(AAC)。
// 入力が m4a/aac/mp3/wav 等の AVAsset が読める形式なら動く。
public class AudioTrimModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioTrimModule")

    AsyncFunction("trimAudio") { (sourceUri: String, startSec: Double, endSec: Double, promise: Promise) in
      guard let sourceURL = URL(string: sourceUri) ?? URL(fileURLWithPath: sourceUri) as URL? else {
        promise.reject("E_BAD_URI", "invalid source uri: \(sourceUri)")
        return
      }

      let asset = AVURLAsset(url: sourceURL)
      let totalSec = CMTimeGetSeconds(asset.duration)
      let s = max(0.0, min(totalSec, startSec))
      let e = max(s, min(totalSec, endSec))
      if e <= s {
        promise.reject("E_BAD_RANGE", "endSec must be > startSec (clamped: \(s)..\(e))")
        return
      }

      guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
        promise.reject("E_NO_EXPORTER", "AVAssetExportSession unavailable")
        return
      }

      let outDir = FileManager.default.temporaryDirectory
      let outURL = outDir.appendingPathComponent("trim_\(UUID().uuidString).m4a")
      exporter.outputURL = outURL
      exporter.outputFileType = .m4a
      let timescale: CMTimeScale = 600
      let startCM = CMTime(seconds: s, preferredTimescale: timescale)
      let endCM = CMTime(seconds: e, preferredTimescale: timescale)
      exporter.timeRange = CMTimeRange(start: startCM, end: endCM)

      exporter.exportAsynchronously {
        switch exporter.status {
        case .completed:
          let durationMs = Int(round((e - s) * 1000.0))
          promise.resolve([
            "uri": outURL.absoluteString,
            "durationMs": durationMs,
            "mimeType": "audio/mp4",
          ])
        case .failed, .cancelled:
          promise.reject("E_EXPORT_FAILED", exporter.error?.localizedDescription ?? "export failed")
        default:
          promise.reject("E_EXPORT_UNKNOWN", "exporter status: \(exporter.status.rawValue)")
        }
      }
    }
  }
}
