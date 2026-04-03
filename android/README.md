# Gramakam UPI Monitor — Android App

SMS-based UPI payment monitor for the Gramakam merchandise checkout system. Reads incoming bank SMS, parses Kerala Gramin Bank UPI credit confirmations, and pushes them to Firestore for automatic order verification.

## Setup & Build

### Prerequisites
- Android Studio (latest)
- Android SDK API 35
- Kotlin 2.1.0+
- Gradle 8.11+

### Steps

1. **Open in Android Studio**
   ```bash
   # Open the android/ folder in Android Studio
   File → Open → <path-to>/android
   ```

2. **Gradle Sync**
   - Android Studio will automatically download dependencies
   - Wait for Gradle sync to complete (may take 2-3 minutes on first build)

3. **Build APK**
   - Menu: `Build → Build APK`
   - APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Install on Phone**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Grant Permissions**
   - Open the app on your phone
   - Grant SMS read/receive permissions when prompted
   - Go to phone settings → Apps → Gramakam UPI Monitor → Battery → Allow unrestricted battery use (important!)

### How It Works

1. **SMS Monitoring**: The app runs a **Foreground Service** with a persistent notification to ensure the OS does not kill it. It listens for `KGBANK` SMS credits.
2. **Hardening**: Uses the `upiRef` as the Firestore document ID. This prevents duplicates even if the same message is processed multiple times.
3. **Redesigned UI**: A modern "Royal Gramakam" theme with deep maroon and gold accents, featuring a "Live" status indicator.

### Features

- **24/7 Monitoring**: Persistent service keeps listening even in standby.
- **Duplicate Protection**: Transaction-level idempotency via `upiRef`.
- **Live Status**: Pulsating indicator shows the monitor is active and healthy.
- **Simulation Mode**: For testing, **long-press the payment count** at the top to simulate a random incoming transaction.

### Test Simulation
To test the entire pipeline without a real bank SMS:
1. Long-press the "0 payment(s) captured" or similar text in the header.
2. A random transaction will be generated, parsed, and pushed to Firestore.

### File Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/org/gramakam/upimonitor/
│   │   │   ├── MainActivity.kt        — UI + permission handling
│   │   │   ├── SmsReceiver.kt         — BroadcastReceiver for SMS
│   │   │   ├── SmsParser.kt           — Regex parser
│   │   │   ├── FirestoreService.kt    — Firebase push
│   │   │   ├── PaymentAdapter.kt      — RecyclerView adapter
│   │   │   └── Payment.kt             — Data class
│   │   └── res/
│   │       ├── layout/
│   │       │   ├── activity_main.xml
│   │       │   └── item_payment.xml
│   │       └── values/
│   │           ├── colors.xml
│   │           ├── strings.xml
│   │           └── themes.xml
│   ├── build.gradle.kts
│   └── google-services.json           — Firebase config (generated)
├── build.gradle.kts
├── settings.gradle.kts
└── gradlew / gradlew.bat
```

### Testing Payment Parsing

To test the SMS parser without an actual bank SMS:

```kotlin
val testSms = """Dear Customer, Account XXXX061 is credited with INR 240 on 26-03-2026 09:09:40 from sukanyasujith08. UPI Ref. no. 608509887009-Kerala Gramin Bank."""
val payment = SmsParser.parse(testSms)
// Output: Payment(amount=240.0, datetime="26-03-2026 09:09:40", senderUpi="sukanyasujith08", upiRef="608509887009", bank="Kerala Gramin Bank")
```

### Notes

- The app runs in the background and continues monitoring for SMS even when closed (if permissions are granted)
- Battery optimization must be disabled for reliable background operation
- Each payment is pushed to Firestore with a unique auto-generated ID
- Website automatically matches payments to orders when `upiRef` + `amount >= orderTotal`
