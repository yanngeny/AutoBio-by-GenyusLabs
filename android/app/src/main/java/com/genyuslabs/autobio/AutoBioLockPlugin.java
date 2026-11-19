package com.genyuslabs.autobio;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Verrouillage de l'appli : écran de confirmation Android (empreinte, code ou schéma du téléphone).
 * Si le téléphone n'a aucun verrouillage, renvoie available:false et l'appli ne bloque pas.
 */
@CapacitorPlugin(name = "AutoBioLock")
public class AutoBioLockPlugin extends Plugin {

    @PluginMethod
    public void authenticate(PluginCall call) {
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        if (km == null || !km.isDeviceSecure()) {
            JSObject r = new JSObject();
            r.put("available", false);
            call.resolve(r);
            return;
        }
        Intent intent = km.createConfirmDeviceCredentialIntent(call.getString("title", "AutoBio"), null);
        if (intent == null) {
            JSObject r = new JSObject();
            r.put("available", false);
            call.resolve(r);
            return;
        }
        startActivityForResult(call, intent, "authResult");
    }

    @ActivityCallback
    private void authResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        r.put("available", true);
        r.put("ok", result.getResultCode() == Activity.RESULT_OK);
        call.resolve(r);
    }
}
