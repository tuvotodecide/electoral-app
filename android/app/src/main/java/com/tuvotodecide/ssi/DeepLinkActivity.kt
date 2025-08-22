package com.tuvotodecide.ssi

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class DeepLinkActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val src: Uri = intent.data ?: run { finish(); return }
    val dst = Uri.parse("content://${packageName}.ssi.bundle/bundle")

    contentResolver.openInputStream(src)?.use { input ->
      contentResolver.openOutputStream(dst, "wt")?.use { output ->
        input.copyTo(output)
      }
    }
    contentResolver.takePersistableUriPermission(
        intent.data!!,
        Intent.FLAG_GRANT_READ_URI_PERMISSION
)
    finish()
  }
}
