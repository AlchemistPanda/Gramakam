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

1. **SMS Monitoring**: The app listens for incoming SMS from Kerala Gramin Bank (sender IDs: `*-KGBANK-S`)
2. **Parsing**: Extracts amount, timestamp, sender UPI, and transaction reference number
3. **Firebase Push**: Sends parsed payment to Firestore `upi_payments` collection
4. **Order Matching**: Website auto-verifies orders when a matching payment is found

### SMS Format (Recognized)

```
Dear Customer, Account XXXX061 is credited with INR 240 on 26-03-2026 09:09:40 from sukanyasujith08. UPI Ref. no. 608509887009-Kerala Gramin Bank.
```

The app filters for:
- Sender contains `KGBANK` (covers variants: AX-KGBANK-S, BZ-KGBANK-S, AD-KGBANK-S, etc.)
- Message contains "credited with INR"

### Firebase Configuration

- **Project**: `gramakam-2026`
- **Collection**: `upi_payments`
- **Config File**: `app/google-services.json` (auto-downloaded via Firebase CLI)

### App Features

- **Real-time Payment List**: Shows all captured UPI payments with status (matched/unmatched)
- **Live Firestore Sync**: Updates instantly as payments arrive
- **Status Indicator**: Shows listening status and SMS permission state
- **Swipe to Refresh**: Manual refresh of payment list

### Troubleshooting

| Issue | Solution |
|-------|----------|
| App crashes on start | Check `google-services.json` exists in `app/` directory |
| SMS not captured | Verify app has SMS permissions in Settings → Apps → Permissions |
| Payments not in Firestore | Check Firebase Firestore rules allow `upi_payments` collection read/write |
| Slow/no sync | Disable battery optimization for the app in Settings → Battery |

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
