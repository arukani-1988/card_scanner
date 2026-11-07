package expo.modules.cardwatcher

import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore

/** Runs when a new photo appears in the gallery. Posts a notification if the photo looks like a business card. */
class CardPhotoJobService : JobService() {

  override fun onStartJob(params: JobParameters): Boolean {
    val uris: List<Uri> = params.triggeredContentUris?.toList() ?: emptyList()
    val context = applicationContext
    Thread {
      try {
        handle(context, uris)
      } catch (e: Exception) {
        // A failed check must never crash the app; the next photo simply gets its own check.
      } finally {
        jobFinished(params, false)
        PhotoWatcher.schedule(context)
      }
    }.start()
    return true
  }

  override fun onStopJob(params: JobParameters): Boolean {
    PhotoWatcher.schedule(applicationContext)
    return false
  }

  private fun handle(context: Context, uris: List<Uri>) {
    val seen = HashSet<String>()
    for (uri in uris) {
      if (!seen.add(uri.toString())) continue
      if (seen.size > 4) break
      if (!isFreshCameraPhoto(context, uri)) continue
      val lines = CardDetector.readLines(context, uri) ?: continue
      val summary = CardDetector.summarise(lines) ?: continue
      Notifier.show(context, uri, summary)
      return
    }
  }

  /** True for a photo added in the last few minutes that came from the camera, not a screenshot or download. */
  private fun isFreshCameraPhoto(context: Context, uri: Uri): Boolean {
    val projection = ArrayList<String>()
    projection.add(MediaStore.MediaColumns.DATE_ADDED)
    projection.add(MediaStore.MediaColumns.DISPLAY_NAME)
    if (Build.VERSION.SDK_INT >= 29) {
      projection.add(MediaStore.MediaColumns.RELATIVE_PATH)
    }

    val cursor: Cursor? = try {
      context.contentResolver.query(uri, projection.toTypedArray(), null, null, null)
    } catch (e: Exception) {
      null
    }
    if (cursor == null) return false

    return cursor.use { c ->
      if (c.moveToFirst()) {
        val added = c.getLong(0)
        val name = c.getString(1) ?: ""
        val path = if (Build.VERSION.SDK_INT >= 29) (c.getString(2) ?: "") else ""
        isCameraPhoto(added, name, path)
      } else {
        false
      }
    }
  }

  private fun isCameraPhoto(addedSeconds: Long, name: String, path: String): Boolean {
    val now = System.currentTimeMillis() / 1000
    if (now - addedSeconds > 180) return false
    if (name.contains("screenshot", ignoreCase = true)) return false
    if (path.contains("screenshot", ignoreCase = true)) return false
    if (Build.VERSION.SDK_INT >= 29 && !path.startsWith("DCIM", ignoreCase = true)) return false
    return true
  }
}
