package expo.modules.napsnapaudiotrim

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.ByteBuffer
import java.util.UUID

// 音声ファイルを [startSec, endSec] に切り出す Android 実装。
// MediaExtractor で sample 単位に読み、MediaMuxer で MP4(AAC) に書き直す。
// 追加依存なし。AAC/M4A 入力に対して動く（録音側が AAC を吐く expo-audio 想定）。
class AudioTrimModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioTrimModule")

    AsyncFunction("trimAudio") { sourceUri: String, startSec: Double, endSec: Double ->
      if (endSec <= startSec) throw IllegalArgumentException("endSec must be > startSec")

      val context = appContext.reactContext
        ?: throw IllegalStateException("react context unavailable")

      val extractor = MediaExtractor()
      val parsedUri = Uri.parse(sourceUri)
      if (parsedUri.scheme == "file" || parsedUri.scheme == null) {
        val path = parsedUri.path ?: sourceUri.removePrefix("file://")
        extractor.setDataSource(path)
      } else {
        extractor.setDataSource(context, parsedUri, null)
      }

      // 最初の audio トラックを選ぶ
      var trackIndex = -1
      var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val f = extractor.getTrackFormat(i)
        val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          trackIndex = i
          format = f
          break
        }
      }
      if (trackIndex < 0 || format == null) {
        extractor.release()
        throw IllegalStateException("no audio track in source")
      }
      extractor.selectTrack(trackIndex)

      val outFile = File(context.cacheDir, "trim_${UUID.randomUUID()}.m4a")
      val muxer = MediaMuxer(outFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      val outTrackIndex = muxer.addTrack(format)
      muxer.start()

      val startUs = (startSec * 1_000_000).toLong()
      val endUs = (endSec * 1_000_000).toLong()

      // sync sample にシーク（AAC は基本どこでも sync として扱える）。
      extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

      // 出力タイムスタンプは 0 起点に揃える。
      val baseUs = extractor.sampleTime.coerceAtLeast(0L).let { if (it < startUs) startUs else it }
      val bufferSize = (format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE).takeIf { it > 0 } ?: 64 * 1024)
      val buffer = ByteBuffer.allocate(bufferSize)
      val info = MediaCodec.BufferInfo()

      var writtenMs = 0L
      while (true) {
        info.offset = 0
        info.size = extractor.readSampleData(buffer, 0)
        if (info.size < 0) break
        val ptsUs = extractor.sampleTime
        if (ptsUs > endUs) break
        if (ptsUs >= startUs) {
          info.presentationTimeUs = ptsUs - baseUs
          val flags = extractor.sampleFlags
          var muxerFlags = 0
          if (flags and MediaExtractor.SAMPLE_FLAG_SYNC != 0) {
            muxerFlags = muxerFlags or MediaCodec.BUFFER_FLAG_KEY_FRAME
          }
          info.flags = muxerFlags
          muxer.writeSampleData(outTrackIndex, buffer, info)
          writtenMs = (info.presentationTimeUs / 1000)
        }
        extractor.advance()
      }

      try { muxer.stop() } catch (_: Throwable) {}
      try { muxer.release() } catch (_: Throwable) {}
      try { extractor.release() } catch (_: Throwable) {}

      mapOf(
        "uri" to Uri.fromFile(outFile).toString(),
        "durationMs" to writtenMs.toInt(),
        "mimeType" to "audio/mp4",
      )
    }
  }
}
