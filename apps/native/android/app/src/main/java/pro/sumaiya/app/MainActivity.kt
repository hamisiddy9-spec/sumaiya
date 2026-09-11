package pro.sumaiya.app

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    applyOrientationForScreenSize()
  }

  // The manifest no longer hard-locks portrait (was android:screenOrientation
  // "portrait") — Android's own large-screen guidance documents that a
  // locked orientation gets LETTERBOXED on a foldable's unfolded screen or a
  // tablet (developer.android.com/guide/practices/device-compatibility-mode),
  // and starting with Android 16 the OS stops honouring an orientation lock
  // at all on screens ≥600dp, forcing the app to handle both orientations
  // regardless. Since the JS layer has no landscape-aware layouts, the right
  // behaviour is: lock portrait on a normal (compact-width) phone exactly
  // like before, but let a large screen — an unfolded foldable's inner
  // display, a tablet — size and rotate freely instead of floating
  // letterboxed in the middle of it. `android:configChanges` already
  // includes screenSize/smallestScreenSize/orientation so this activity is
  // NOT recreated on a fold/unfold or rotation — onConfigurationChanged
  // below re-evaluates every time instead.
  private fun applyOrientationForScreenSize() {
    val widthDp = resources.configuration.screenWidthDp
    requestedOrientation = if (widthDp < 600) {
      ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    } else {
      ActivityInfo.SCREEN_ORIENTATION_FULL_USER
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    // Must call super first — ReactActivity forwards this to the JS layer
    // (the RN "change" event on Dimensions/useWindowDimensions) and that
    // must not be skipped just because we're also reacting to it here.
    super.onConfigurationChanged(newConfig)
    applyOrientationForScreenSize()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
