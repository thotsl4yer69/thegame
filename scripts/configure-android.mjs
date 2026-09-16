import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const root = process.cwd();
const androidRoot = join(root, 'android', 'app', 'src', 'main');
const manifestPath = join(androidRoot, 'AndroidManifest.xml');
const activityPath = join(androidRoot, 'java', 'com', 'thotsl4yer69', 'thegame', 'MainActivity.java');

if (!existsSync(manifestPath)) throw new Error('Android project missing. Run npx cap add android first.');

let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android.permission.VIBRATE')) {
  manifest = manifest.replace('<manifest', '<manifest').replace(/(<manifest[^>]*>)/, '$1\n    <uses-permission android:name="android.permission.VIBRATE" />');
}
manifest = manifest.replace(/<activity\s+([^>]*android:name="\.MainActivity"[^>]*)>/s, (match, attrs) => {
  let next = attrs;
  if (/android:screenOrientation=/.test(next)) {
    next = next.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="sensorLandscape"');
  } else {
    next += '\n            android:screenOrientation="sensorLandscape"';
  }
  return `<activity\n            ${next.trim()}>`;
});

const iconSource = join(root, 'public', 'icons', 'icon-512.png');
const drawableDir = join(androidRoot, 'res', 'drawable');
if (existsSync(iconSource)) {
  mkdirSync(drawableDir, { recursive: true });
  copyFileSync(iconSource, join(drawableDir, 'ts69_icon.png'));
  manifest = manifest.replace(/android:icon="[^"]+"/, 'android:icon="@drawable/ts69_icon"');
  manifest = manifest.replace(/android:roundIcon="[^"]+"/, 'android:roundIcon="@drawable/ts69_icon"');
}
writeFileSync(manifestPath, manifest);

mkdirSync(dirname(activityPath), { recursive: true });
writeFileSync(activityPath, `package com.thotsl4yer69.thegame;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUi();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    private void hideSystemUi() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }
}
`);

console.log('Android shell configured: sensor landscape, immersive UI, keep-screen-on, vibration and TS69 launcher icon.');
