package com.genyuslabs.autobio;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AutoBioFilePlugin.class);
        registerPlugin(AutoBioCalendarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
