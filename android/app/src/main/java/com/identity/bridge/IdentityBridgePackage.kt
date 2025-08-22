package com.identity.bridge

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager

class IdentityBridgePackage : ReactPackage {
  override fun createNativeModules(rc: ReactApplicationContext): List<NativeModule> =
    listOf(IdentityBridge(rc))
  override fun createViewManagers(rc: ReactApplicationContext) =
    emptyList<ViewManager<*, *>>()
}