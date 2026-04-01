package org.gramakam.upimonitor

import android.util.Log
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

object FirestoreService {

    private const val TAG = "FirestoreService"
    private const val COLLECTION = "upi_payments"

    fun pushPayment(payment: Payment, rawSms: String) {
        val db = Firebase.firestore
        val data = hashMapOf(
            "amount" to payment.amount,
            "datetime" to payment.datetime,
            "senderUpi" to payment.senderUpi,
            "upiRef" to payment.upiRef,
            "bank" to payment.bank,
            "rawSms" to rawSms,
            "capturedAt" to FieldValue.serverTimestamp(),
            "matched" to false
        )
        db.collection(COLLECTION)
            .add(data)
            .addOnSuccessListener { doc ->
                Log.d(TAG, "Payment pushed: ${doc.id} — ₹${payment.amount} ref ${payment.upiRef}")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to push payment", e)
            }
    }
}
