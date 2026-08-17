# Copilot Android test brief — THOTSL4YER69

Use this brief to test the latest `main` build as a real Android app.

## Objective

Validate that the Phaser/Vite game behaves correctly when packaged as a native Android debug APK through Capacitor, with special attention to touch input, landscape layout, audio, persistence, pause/resume, PWA-origin assumptions, and offline startup.

## Build

```bash
npm ci
npm install --no-save @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

Install `android/app/build/outputs/apk/debug/app-debug.apk` on an Android phone.

## Copilot execution prompt

> You are the Android QA engineer for THOTSL4YER69. Test the installed APK on a physical Android phone in landscape orientation. Do not merely inspect source code. Execute the game and report concrete pass/fail evidence.
>
> 1. Cold launch the APK. Confirm the title screen renders without a blank WebView, console error, missing image, or broken font.
> 2. Confirm the four difficulty buttons work and that FERAL remains selected after closing/reopening the app.
> 3. Open HOW TO SURVIVE and CAST. Confirm both modals open, scroll/fit correctly and close cleanly.
> 4. Start a run. Verify the canvas fills the landscape play area without horizontal page scrolling or important HUD/control clipping.
> 5. Exercise every touch control: left, right, jump, smack, heavy, dash, bag, pigeon and rain. Verify each produces the expected gameplay action and no stuck input remains after lifting the finger.
> 6. Test rapid touch combinations and repeated taps. Look for input drops, duplicated actions, accidental page scrolling, or UI overlays intercepting controls.
> 7. Play through at least one complete wave and one boss encounter. Verify enemies, projectiles, pickups, HUD values, combo, HIGH meter and boss health update visually.
> 8. Intentionally reduce player MEAT and verify critical-health feedback appears. Fill HIGH and verify MONEY SHOT readiness feedback.
> 9. Press Android system back. Verify it does not unexpectedly exit the game or corrupt the current run. If the app has a custom pause route, verify pause/resume is stable.
> 10. Background the app for 5–10 seconds and return. Verify the game remains responsive and audio/input state is sane.
> 11. Complete or deliberately fail a run. Verify the result screen, score, run statistics and retry flow.
> 12. Force-close and relaunch. Verify local persistence for difficulty, best score/rap sheet and unlocked content.
> 13. Enable Android battery/data restrictions temporarily if available and verify the game still starts after the first successful install without network access.
> 14. Rotate the device only if the test device allows it. Record whether portrait is intentionally unsupported, gracefully handled, or broken.
> 15. Capture screenshots for every failure and record exact reproduction steps.
>
> Report using this structure:
>
> - **PASS:** test number + evidence
> - **FAIL:** test number + exact symptom + reproduction steps
> - **BLOCKED:** test number + why
> - **DEVICE:** manufacturer/model, Android version, screen resolution
> - **APK:** version shown by package/build metadata
> - **PERFORMANCE:** obvious frame drops, input latency, overheating or audio glitches
> - **RECOMMENDATION:** release / fix-first / investigate

## Release gate

Do not call the Android build release-ready if there is a crash, blank WebView, broken touch control, unrecoverable pause/background state, corrupted persistence, missing production asset, or serious landscape clipping.
