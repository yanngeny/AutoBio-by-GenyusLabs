package com.genyuslabs.autobio;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/**
 * Lecture de texte sur une photo (pompe, compteur), entièrement sur le téléphone :
 * le modèle ML Kit est embarqué, aucune connexion ni service en ligne.
 */
@CapacitorPlugin(name = "AutoBioOcr")
public class AutoBioOcrPlugin extends Plugin {

    private TextRecognizer recognizer;

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
            if (recognizer == null) {
                recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            }
            recognizer.process(InputImage.fromBitmap(bmp, 0))
                    .addOnSuccessListener(result -> {
                        JSObject out = new JSObject();
                        out.put("text", result.getText());
                        call.resolve(out);
                    })
                    .addOnFailureListener(e -> call.reject("Lecture impossible : " + e.getMessage()));
        } catch (Exception e) {
            call.reject("Lecture impossible : " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (recognizer != null) {
            recognizer.close();
            recognizer = null;
        }
    }
}
