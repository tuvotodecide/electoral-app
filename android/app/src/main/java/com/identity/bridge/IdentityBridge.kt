package com.identity.bridge

import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ProviderInfo
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule 

@ReactModule(name = IdentityBridge.NAME)
class IdentityBridge(private val ctx: ReactApplicationContext)
  : ReactContextBaseJavaModule(ctx) {

  companion object { const val NAME = "IdentityBridge" }

  override fun getName() = NAME


  @ReactMethod
  fun requestBundle(promise: Promise) {
    val pm    = ctx.packageManager
    val myPkg = ctx.packageName

    val target: ProviderInfo? = pm.queryContentProviders(null, 0, 0)
      .firstOrNull { pi ->
        pi.readPermission == "com.identity.permission.SSI" &&
        pm.checkSignatures(myPkg, pi.packageName) == PackageManager.SIGNATURE_MATCH &&
        pi.packageName != myPkg
      }

    if (target == null) { promise.resolve(false); return }

    val srcUri = Uri.parse("content://${target.authority}/bundle")
    val intent = Intent(
    ctx, Class.forName("$myPkg.ssi.DeepLinkActivity")
).apply {
    data = srcUri
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
           or Intent.FLAG_GRANT_READ_URI_PERMISSION
           or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)   // ← NUEVO
}
    ctx.startActivity(intent)
    promise.resolve(true)
  }

  /** Devuelve authority propia (“com.xxx.ssi.bundle”) */
  @ReactMethod
  fun getProviderAuthority(promise: Promise) =
    promise.resolve("${ctx.packageName}.ssi.bundle")
}
