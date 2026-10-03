package pro.sumaiya.apkshare

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Exposes this app's own installed APK path (ApplicationInfo.sourceDir) to JS.
 *
 * No Expo module covers this — expo-application deliberately stops at IDs and
 * install metadata, never the APK's own file path. Android 9+ places installed
 * APKs under a per-install hashed directory
 * (/data/app/~~<hash>==/pro.sumaiya.app-<hash>==/base.apk), so there is no way
 * to construct this path from JS; it has to come from PackageManager. This is
 * the one piece "Nitumie Sumaiya" (share this app's APK phone-to-phone) needs
 * that no existing dependency provides.
 */
class SumaiyaApkShareModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SumaiyaApkShare")

    Constant("apkSourcePath") {
      context.applicationInfo.sourceDir
    }
  }
}
