package expo.modules.cardwatcher

import android.content.Context
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.util.concurrent.TimeUnit

/** A light check for "does this photo look like a business card?" Full reading happens in the app. */
object CardDetector {
  data class Summary(val phones: Int, val emails: Int, val hasWebsite: Boolean)

  private val emailRe = Regex("[A-Za-z0-9._%+-]+\\s*@\\s*[A-Za-z0-9-]+")
  private val phoneRe = Regex("(?:\\+|00)?\\d[\\d\\s().\\-]{6,}\\d")
  private val urlRe = Regex("(?i)\\bwww\\.[^\\s]+|\\b[a-z0-9-]+\\.(com|in|co\\.in|net|org|io)\\b")

  /** Reads the text lines from the photo on the phone. Returns null if reading fails. */
  fun readLines(context: Context, uri: Uri): List<String>? {
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    return try {
      val image = InputImage.fromFilePath(context, uri)
      val result = Tasks.await(recognizer.process(image), 20, TimeUnit.SECONDS)
      result.textBlocks.flatMap { block -> block.lines.map { line -> line.text } }
    } catch (e: Exception) {
      null
    } finally {
      recognizer.close()
    }
  }

  /** Cards have a few short lines and at least two of: phone number, email, website. */
  fun summarise(lines: List<String>): Summary? {
    val clean = lines.map { it.trim() }.filter { it.isNotEmpty() }
    if (clean.size < 3 || clean.size > 30) return null
    if (clean.joinToString("\n").length > 700) return null

    val phones = clean.count { line ->
      val digits = line.count { ch -> ch.isDigit() }
      phoneRe.containsMatchIn(line) && digits in 8..15
    }
    val emails = clean.count { emailRe.containsMatchIn(it) }
    val web = clean.any { urlRe.containsMatchIn(it) }

    var signals = 0
    if (phones > 0) signals++
    if (emails > 0) signals++
    if (web) signals++
    if (signals < 2) return null
    return Summary(phones, emails, web)
  }
}
