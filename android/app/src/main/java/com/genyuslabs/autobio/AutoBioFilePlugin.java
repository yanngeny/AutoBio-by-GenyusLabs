package com.genyuslabs.autobio;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Document de travail AutoBio choisi par l'utilisateur via le sélecteur de fichiers Android
 * (Storage Access Framework) : Google Drive, mémoire du téléphone, autre appli de stockage.
 */
@CapacitorPlugin(name = "AutoBioFile")
public class AutoBioFilePlugin extends Plugin {

    @PluginMethod
    public void pickFile(PluginCall call) {
        String mode = call.getString("mode", "open");
        Intent intent;
        if ("create".equals(mode)) {
            intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE, call.getString("name", "AutoBio.json"));
        } else {
            intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.setType("*/*");
        }
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "pickResult");
    }

    @ActivityCallback
    private void pickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("cancelled");
            return;
        }
        Uri uri = result.getData().getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (Exception ignored) {
            // Certains fournisseurs n'offrent pas de permission persistante : on garde l'URI quand même.
        }
        JSObject out = new JSObject();
        out.put("uri", uri.toString());
        out.put("name", displayName(uri));
        call.resolve(out);
    }

    @PluginMethod
    public void read(PluginCall call) {
        Uri uri = uriOf(call);
        if (uri == null) return;
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) { call.reject("Fichier illisible"); return; }
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[16384];
            int n;
            while ((n = in.read(chunk)) > 0) buf.write(chunk, 0, n);
            JSObject out = new JSObject();
            out.put("content", new String(buf.toByteArray(), StandardCharsets.UTF_8));
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Lecture impossible : " + e.getMessage());
        }
    }

    @PluginMethod
    public void write(PluginCall call) {
        Uri uri = uriOf(call);
        if (uri == null) return;
        String content = call.getString("content");
        if (content == null) { call.reject("Contenu manquant"); return; }
        // « wt » : écrase le contenu existant (le document de travail est remplacé à chaque modification).
        try (OutputStream os = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (os == null) { call.reject("Fichier non modifiable"); return; }
            os.write(content.getBytes(StandardCharsets.UTF_8));
            os.flush();
            call.resolve();
        } catch (Exception e) {
            call.reject("Écriture impossible : " + e.getMessage());
        }
    }

    private Uri uriOf(PluginCall call) {
        String s = call.getString("uri");
        if (s == null) { call.reject("uri manquante"); return null; }
        return Uri.parse(s);
    }

    private String displayName(Uri uri) {
        ContentResolver cr = getContext().getContentResolver();
        try (Cursor c = cr.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) { }
        String last = uri.getLastPathSegment();
        return last != null ? last : "AutoBio.json";
    }
}
