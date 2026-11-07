package expo.modules.cardwatcher

import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ComponentName
import android.content.Context
import android.provider.MediaStore

/** Keeps a system job registered that wakes up when a new photo is added to the gallery. */
object PhotoWatcher {
  private const val JOB_ID = 4711
  private const val PREFS = "card_watcher"
  private const val KEY_ENABLED = "enabled"

  fun isEnabled(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)
  }

  fun setEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, enabled).apply()
    if (enabled) {
      schedule(context)
    } else {
      cancel(context)
    }
  }

  /** The system runs a content-trigger job once per change, so it is scheduled again after every run. */
  fun schedule(context: Context) {
    if (!isEnabled(context)) return
    val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
    val job = JobInfo.Builder(JOB_ID, ComponentName(context, CardPhotoJobService::class.java))
      .addTriggerContentUri(
        JobInfo.TriggerContentUri(
          MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
          JobInfo.TriggerContentUri.FLAG_NOTIFY_FOR_DESCENDANTS
        )
      )
      .setTriggerContentUpdateDelay(1500)
      .setTriggerContentMaxDelay(6000)
      .build()
    scheduler.schedule(job)
  }

  fun cancel(context: Context) {
    val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
    scheduler.cancel(JOB_ID)
  }
}
