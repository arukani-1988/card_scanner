package expo.modules.cardwatcher

import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class CardWatcherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CardWatcher")

    Events("onSharedImage")

    // Turns the "notify me when a new camera photo looks like a business card" watcher on or off.
    Function("setPhotoDetection") { enabled: Boolean ->
      val context = appContext.reactContext
      if (context != null) {
        PhotoWatcher.setEnabled(context, enabled)
      }
      context != null
    }

    Function("isPhotoDetectionEnabled") {
      val context = appContext.reactContext
      context != null && PhotoWatcher.isEnabled(context)
    }

    // A photo that was sent to the app with the Share menu before the app was open.
    Function("getInitialSharedImage") {
      readSharedImage(appContext.currentActivity?.intent)
    }

    // A photo shared while the app is already running.
    OnNewIntent { intent ->
      val uri = readSharedImage(intent)
      if (uri != null) {
        sendEvent("onSharedImage", mapOf("uri" to uri))
      }
    }
  }

  /** Copies a shared image into the app's cache and returns its file:// address, or null. */
  private fun readSharedImage(intent: Intent?): String? {
    if (intent == null) return null
    if (intent.action != Intent.ACTION_SEND) return null
    val type = intent.type ?: return null
    if (!type.startsWith("image/")) return null

    @Suppress("DEPRECATION")
    val source = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM) ?: return null
    val context = appContext.reactContext ?: return null

    // Mark the intent as handled so reopening the app from recent apps does not import the photo again.
    intent.action = Intent.ACTION_MAIN

    return try {
      val dir = File(context.cacheDir, "shared")
      dir.mkdirs()
      val target = File(dir, "shared_" + System.currentTimeMillis() + ".jpg")
      val input = context.contentResolver.openInputStream(source) ?: return null
      input.use { stream ->
        target.outputStream().use { out -> stream.copyTo(out) }
      }
      Uri.fromFile(target).toString()
    } catch (e: Exception) {
      null
    }
  }
}
