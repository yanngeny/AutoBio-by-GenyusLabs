package com.genyuslabs.autobio;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Reçoit de l'appli le texte à afficher dans le widget (véhicule, km, prochaine échéance). */
@CapacitorPlugin(name = "AutoBioWidget")
public class AutoBioWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor ed = ctx.getSharedPreferences(QuickAddWidget.PREFS, Context.MODE_PRIVATE).edit();
        ed.putString("title", call.getString("title", ""));
        ed.putString("sub", call.getString("sub", ""));
        ed.putString("sub2", call.getString("sub2", ""));
        ed.putString("sub3", call.getString("sub3", ""));
        ed.apply();
        QuickAddWidget.refreshAll(ctx);
        call.resolve();
    }
}
