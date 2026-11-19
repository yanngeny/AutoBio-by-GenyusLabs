package com.genyuslabs.autobio;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

/** Dictée : ouvre la reconnaissance vocale du système (aucune permission nécessaire) et renvoie le texte. */
@CapacitorPlugin(name = "AutoBioVoice")
public class AutoBioVoicePlugin extends Plugin {

    @PluginMethod
    public void listen(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "fr-FR"));
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            startActivityForResult(call, intent, "voiceResult");
        } catch (ActivityNotFoundException e) {
            call.reject("Dictée indisponible sur ce téléphone");
        }
    }

    @ActivityCallback
    private void voiceResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        Intent data = result.getData();
        ArrayList<String> list = data != null ? data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS) : null;
        if (result.getResultCode() == Activity.RESULT_OK && list != null && !list.isEmpty()) {
            r.put("text", list.get(0));
            r.put("cancelled", false);
        } else {
            r.put("text", "");
            r.put("cancelled", true);
        }
        call.resolve(r);
    }
}
