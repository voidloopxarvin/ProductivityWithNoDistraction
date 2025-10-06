package com.preplockmobile;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

public class AppBlockerModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    AppBlockerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "AppBlocker";
    }

    @ReactMethod
    public void checkUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), reactContext.getPackageName());
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestUsagePermission() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void getForegroundApp(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
                long time = System.currentTimeMillis();
                List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY,
                        time - 1000 * 1000, time);
                
                if (appList != null && appList.size() > 0) {
                    SortedMap<Long, UsageStats> sortedMap = new TreeMap<>();
                    for (UsageStats usageStats : appList) {
                        sortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                    }
                    if (!sortedMap.isEmpty()) {
                        String packageName = sortedMap.get(sortedMap.lastKey()).getPackageName();
                        promise.resolve(packageName);
                        return;
                    }
                }
            }
            promise.resolve("");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            WritableArray apps = Arguments.createArray();
            List<android.content.pm.ApplicationInfo> packages = reactContext.getPackageManager()
                    .getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA);
            
            for (android.content.pm.ApplicationInfo packageInfo : packages) {
                if ((packageInfo.flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0) {
                    WritableMap app = Arguments.createMap();
                    app.putString("packageName", packageInfo.packageName);
                    app.putString("appName", packageInfo.loadLabel(reactContext.getPackageManager()).toString());
                    apps.pushMap(app);
                }
            }
            promise.resolve(apps);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void blockApp(String packageName) {
        // Launch blocking activity
        Intent intent = new Intent(reactContext, BlockedAppActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra("blockedApp", packageName);
        reactContext.startActivity(intent);
    }
}
