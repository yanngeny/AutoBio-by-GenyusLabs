package com.genyuslabs.autobio;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Widget d'écran d'accueil : 4 boutons d'ajout rapide (Plein, Entretien, Dépense, Km)
 * + nom du véhicule et prochaine échéance. Chaque bouton ouvre l'appli sur le bon formulaire
 * via le lien autobio://add/<type>.
 */
public class QuickAddWidget extends AppWidgetProvider {
    static final String PREFS = "autobio_widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    /** Redessine tous les widgets posés (appelé quand l'appli pousse de nouvelles données). */
    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, QuickAddWidget.class));
        if (ids.length > 0) for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_quick_add);
        v.setTextViewText(R.id.w_title, sp.getString("title", ctx.getString(R.string.widget_no_vehicle)));
        v.setTextViewText(R.id.w_sub, sp.getString("sub", ctx.getString(R.string.widget_open_app)));
        String s2 = sp.getString("sub2", ""), s3 = sp.getString("sub3", "");
        v.setTextViewText(R.id.w_sub2, s2);
        v.setViewVisibility(R.id.w_sub2, s2.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.w_sub3, s3);
        v.setViewVisibility(R.id.w_sub3, s3.isEmpty() ? View.GONE : View.VISIBLE);
        v.setOnClickPendingIntent(R.id.w_header, link(ctx, "home", 0));
        v.setOnClickPendingIntent(R.id.w_fuel, link(ctx, "plein", 1));
        v.setOnClickPendingIntent(R.id.w_maint, link(ctx, "entretien", 2));
        v.setOnClickPendingIntent(R.id.w_exp, link(ctx, "depense", 3));
        v.setOnClickPendingIntent(R.id.w_km, link(ctx, "km", 4));
        return v;
    }

    private static PendingIntent link(Context ctx, String kind, int req) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("autobio://add/" + kind), ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
