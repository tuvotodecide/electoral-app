
package com.tuvotodecide
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "tuvotodecide"
  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme) // ⬅️ initialize the splash screen
    super.onCreate(savedInstanceState) // super.onCreate(null) with react-native-screens
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent) {
    val action = intent.action
    val type = intent.type

    if (Intent.ACTION_SEND == action && type != null) {
      when {
        type.startsWith("text/plain") -> {
          // Handle shared wira data
          intent.getStringExtra(Intent.EXTRA_TEXT)?.let { sharedText ->
            // Emit event to React Native
            reactInstanceManager.currentReactContext
              ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              ?.emit("SharedText", sharedText)
          }
        }
      }
    }
  }
}