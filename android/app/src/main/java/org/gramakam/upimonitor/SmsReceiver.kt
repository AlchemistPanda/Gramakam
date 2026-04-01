package org.gramakam.upimonitor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

/**
 * Receives incoming SMS and filters for Kerala Gramin Bank UPI credit messages.
 * Sender IDs vary in the first 2 chars: AX-KGBANK-S, BZ-KGBANK-S, AD-KGBANK-S, etc.
 */
class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        // Callback for UI updates
        var onPaymentCaptured: ((Payment, String) -> Unit)? = null
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        // Concatenate multi-part SMS
        val smsMap = mutableMapOf<String, StringBuilder>()
        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: ""
            smsMap.getOrPut(sender) { StringBuilder() }.append(sms.messageBody ?: "")
        }

        for ((sender, bodyBuilder) in smsMap) {
            val body = bodyBuilder.toString()

            // Filter: sender contains "KGBANK" (covers AX-KGBANK-S, BZ-KGBANK-S, etc.)
            if (!sender.contains("KGBANK", ignoreCase = true)) continue

            Log.d(TAG, "Bank SMS from $sender: ${body.take(80)}...")

            val payment = SmsParser.parse(body)
            if (payment != null) {
                Log.d(TAG, "Parsed: ₹${payment.amount} ref=${payment.upiRef} from=${payment.senderUpi}")
                FirestoreService.pushPayment(payment, body)
                onPaymentCaptured?.invoke(payment, body)
            } else {
                Log.w(TAG, "SMS matched sender but failed to parse: ${body.take(120)}")
            }
        }
    }
}
