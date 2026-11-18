package com.genyuslabs.autobio;

import android.content.Intent;
import android.provider.CalendarContract;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Ouvre l'appli Agenda du téléphone avec l'événement pré-rempli (journée entière) :
 * un appui sur « Enregistrer » suffit. Aucune permission ni API Google nécessaire.
 */
@CapacitorPlugin(name = "AutoBioCalendar")
public class AutoBioCalendarPlugin extends Plugin {

    @PluginMethod
    public void addEvent(PluginCall call) {
        try {
            long start = utcMidnight(call.getString("start"));
            String endStr = call.getString("end");
            long end = endStr != null ? utcMidnight(endStr) : start + 24L * 3600 * 1000;
            Intent intent = new Intent(Intent.ACTION_INSERT)
                    .setData(CalendarContract.Events.CONTENT_URI)
                    .putExtra(CalendarContract.Events.TITLE, call.getString("title", "AutoBio"))
                    .putExtra(CalendarContract.Events.DESCRIPTION, call.getString("notes", ""))
                    .putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, call.getBoolean("allDay", true))
                    .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
                    .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, end);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Agenda indisponible : " + e.getMessage());
        }
    }

    private static long utcMidnight(String iso) throws Exception {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        Date d = f.parse(iso);
        if (d == null) throw new IllegalArgumentException("date invalide");
        return d.getTime();
    }
}
