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
            .document(payment.upiRef) // Use upiRef as document ID to prevent duplicates
            .set(data)
            .addOnSuccessListener {
                Log.d(TAG, "Payment pushed: ${payment.upiRef} — ₹${payment.amount}")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to push payment", e)
            }
    }
}
