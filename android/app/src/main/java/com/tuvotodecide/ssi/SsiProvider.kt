package com.tuvotodecide.ssi   //  ← paquete de la app Electoral

import android.content.*
import android.content.pm.PackageManager
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Binder
import android.os.ParcelFileDescriptor
import java.io.File

class SsiProvider : ContentProvider() {

    companion object {
        private const val FILE_NAME   = "bundle_secure.json"
        private const val CODE_BUNDLE = 1
    }

    private lateinit var matcher: UriMatcher     


    override fun onCreate(): Boolean {
        val authority = "${requireNotNull(context).packageName}.ssi.bundle"

        matcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(authority, "bundle", CODE_BUNDLE)
        }
        return true
    }

   
    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
        if (matcher.match(uri) != CODE_BUNDLE)
            throw IllegalArgumentException("URI no reconocida: $uri")

        if (!callerTrusted())
            throw SecurityException("Signature mismatch")

        val file = File(requireNotNull(context).filesDir, FILE_NAME)
            .apply { if (!exists()) createNewFile() }

        val flags = if (mode.contains("w"))
            ParcelFileDescriptor.MODE_READ_WRITE
        else
            ParcelFileDescriptor.MODE_READ_ONLY

        return ParcelFileDescriptor.open(file, flags)
    }

    /** verifica que la app que llama esté firmada con la *misma* keystore */
    private fun callerTrusted(): Boolean {
        val pm      = requireNotNull(context).packageManager
        val pkgs    = pm.getPackagesForUid(Binder.getCallingUid()) ?: return false
        return pm.checkSignatures(requireNotNull(context).packageName, pkgs[0]) ==
               PackageManager.SIGNATURE_MATCH
    }

    /* --------------------------------------------------- */
    /*  Métodos obligatorios no usados                      */
    /* --------------------------------------------------- */
    override fun query(
        uri: Uri, p: Array<String>?, s: String?, a: Array<String>?, o: String?
    ): Cursor? = MatrixCursor(arrayOf("_display_name", "_size")).apply {
        val file = File(requireNotNull(context).filesDir, FILE_NAME)
        addRow(arrayOf(file.name, file.length()))
    }

    override fun getType(uri: Uri)                              = "application/json"
    override fun insert(uri: Uri, v: ContentValues?)            = throw UnsupportedOperationException()
    override fun delete(uri: Uri, s: String?, a: Array<String>?)= 0
    override fun update(uri: Uri, v: ContentValues?, s: String?,a: Array<String>?)= 0
}
