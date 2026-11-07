package expo.modules.cardwatcher

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat

object Notifier {
  private const val CHANNEL_ID = "card_detected"

  fun show(context: Context, imageUri: Uri, summary: CardDetector.Summary) {
    if (Build.VERSION.SDK_INT >= 33 &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
      return
    }

    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Card detection", NotificationManager.IMPORTANCE_DEFAULT)
      )
    }

    val base = imageUri.toString().hashCode()
    val review = pending(context, imageUri, "review", base * 3 + 1)
    val save = pending(context, imageUri, "save", base * 3 + 2)

    val parts = ArrayList<String>()
    if (summary.phones == 1) parts.add("1 phone number")
    if (summary.phones > 1) parts.add(summary.phones.toString() + " phone numbers")
    if (summary.emails == 1) parts.add("1 email")
    if (summary.emails > 1) parts.add(summary.emails.toString() + " emails")
    if (summary.hasWebsite) parts.add("a website")
    val text = "Found " + parts.joinToString(", ") + ". Save it to your contacts?"

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_camera)
      .setContentTitle("Business card detected")
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
      .setContentIntent(review)
      .setAutoCancel(true)
      .addAction(0, "Save contact", save)
      .addAction(0, "Review and edit", review)
      .build()

    manager.notify(base, notification)
  }

  /** Opens the app through its cardscanner:// link, carrying the photo's address and what to do with it. */
  private fun pending(context: Context, imageUri: Uri, action: String, requestCode: Int): PendingIntent {
    val link = Uri.parse("cardscanner://card?action=" + action + "&uri=" + Uri.encode(imageUri.toString()))
    val intent = Intent(Intent.ACTION_VIEW, link)
    intent.setPackage(context.packageName)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
