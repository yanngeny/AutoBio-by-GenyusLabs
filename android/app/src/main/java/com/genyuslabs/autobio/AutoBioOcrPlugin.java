package com.genyuslabs.autobio;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.io.File;

/**
 * Lecture de texte sur une photo (pompe, compteur), entièrement sur le téléphone :
 * le modèle ML Kit est embarqué, aucune connexion ni service en ligne.
 *
 * scan() ouvre l'appareil photo ; la photo est écrite dans le cache privé de l'appli
 * (jamais dans la photothèque), lue, puis supprimée aussitôt, que la lecture réussisse ou non.
 */
@CapacitorPlugin(name = "AutoBioOcr")
public class AutoBioOcrPlugin extends Plugin {

    private TextRecognizer recognizer;

    private TextRecognizer recognizer() {
        if (recognizer == null) {
            recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        }
        return recognizer;
    }

    private File scanFile() {
        File dir = new File(getContext().getCacheDir(), "scan");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        return new File(dir, "scan.jpg");
    }

    private static void wipe(File f) {
        if (f != null && f.exists()) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    @PluginMethod
    public void scan(PluginCall call) {
        try {
            File f = scanFile();
            wipe(f);
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    .putExtra(MediaStore.EXTRA_OUTPUT, uri)
                    .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivityForResult(call, intent, "scanResult");
        } catch (Exception e) {
            call.reject("Appareil photo indisponible : " + e.getMessage());
        }
    }

    @ActivityCallback
    private void scanResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        File f = scanFile();
        if (result.getResultCode() != Activity.RESULT_OK || !f.exists() || f.length() == 0) {
            wipe(f);
            JSObject out = new JSObject();
            out.put("text", "");
            out.put("cancelled", true);
            call.resolve(out);
            return;
        }
        try {
            Bitmap bmp = decode(f);
            wipe(f);
            if (bmp == null) {
                call.reject("Image illisible");
                return;
            }
            recognize(call, bmp);
        } catch (Exception e) {
            wipe(f);
            call.reject("Lecture impossible : " + e.getMessage());
        }
    }

    /** Charge la photo en taille réduite (≈ 2000 px) et la remet à l'endroit d'après l'EXIF. */
    private static Bitmap decode(File f) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(f.getAbsolutePath(), bounds);
        int sample = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 2000) sample *= 2;
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = sample;
        Bitmap bmp = BitmapFactory.decodeFile(f.getAbsolutePath(), opts);
        if (bmp == null) return null;
        int orientation = new ExifInterface(f.getAbsolutePath()).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
        int deg = orientation == ExifInterface.ORIENTATION_ROTATE_90 ? 90 : orientation == ExifInterface.ORIENTATION_ROTATE_180 ? 180 : orientation == ExifInterface.ORIENTATION_ROTATE_270 ? 270 : 0;
        if (deg == 0) return bmp;
        Matrix m = new Matrix();
        m.postRotate(deg);
        return Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
    }

    private void recognize(PluginCall call, Bitmap bmp) {
        recognizer().process(InputImage.fromBitmap(bmp, 0))
                .addOnSuccessListener(result -> {
                    JSObject out = new JSObject();
                    out.put("text", result.getText());
                    call.resolve(out);
                })
                .addOnFailureListener(e -> call.reject("Lecture impossible : " + e.getMessage()));
    }

    /** Lecture d'une image déjà fournie (JPEG en base64), sans rien écrire sur le téléphone. */
    @PluginMethod
    public void readText(PluginCall call) {
        String b64 = call.getString("image");
        if (b64 == null || b64.isEmpty()) {
            call.reject("Aucune image");
            return;
        }
        try {
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            if (bmp == null) {
                call.reject("Image illisible");
                return;
            }
            recognize(call, bmp);
        } catch (Exception e) {
            call.reject("Lecture impossible : " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        wipe(scanFile());
        if (recognizer != null) {
            recognizer.close();
            recognizer = null;
        }
    }
}
