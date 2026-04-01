package org.gramakam.upimonitor

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

class MainActivity : AppCompatActivity() {

    companion object {
        private const val SMS_PERMISSION_CODE = 100
    }

    private lateinit var adapter: PaymentAdapter
    private lateinit var tvStatus: TextView
    private lateinit var tvCount: TextView
    private lateinit var swipeRefresh: SwipeRefreshLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        tvCount = findViewById(R.id.tvCount)
        swipeRefresh = findViewById(R.id.swipeRefresh)

        val recyclerView = findViewById<RecyclerView>(R.id.recyclerPayments)
        adapter = PaymentAdapter()
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        swipeRefresh.setColorSchemeColors(0xFF800020.toInt())
        swipeRefresh.setOnRefreshListener { loadPayments() }

        // Request SMS permissions
        checkSmsPermission()

        // Listen for real-time updates
        listenToPayments()

        // Register callback for UI updates from SmsReceiver
        SmsReceiver.onPaymentCaptured = { _, _ ->
            runOnUiThread { loadPayments() }
        }
    }

    private fun checkSmsPermission() {
        val perms = arrayOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        val needed = perms.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), SMS_PERMISSION_CODE)
        } else {
            tvStatus.text = "Listening for SMS..."
            tvStatus.setTextColor(0xFF2E7D32.toInt())
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == SMS_PERMISSION_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                tvStatus.text = "Listening for SMS..."
                tvStatus.setTextColor(0xFF2E7D32.toInt())
            } else {
                tvStatus.text = "SMS permission denied — app cannot monitor payments"
                tvStatus.setTextColor(0xFFD32F2F.toInt())
            }
        }
    }

    private fun listenToPayments() {
        Firebase.firestore.collection("upi_payments")
            .orderBy("capturedAt", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val items = snapshot.documents.mapNotNull { doc ->
                    PaymentAdapter.PaymentItem(
                        amount = doc.getDouble("amount") ?: 0.0,
                        senderUpi = doc.getString("senderUpi") ?: "",
                        upiRef = doc.getString("upiRef") ?: "",
                        datetime = doc.getString("datetime") ?: "",
                        bank = doc.getString("bank") ?: "",
                        matched = doc.getBoolean("matched") ?: false
                    )
                }
                adapter.updatePayments(items)
                tvCount.text = "${items.size} payment(s) captured"
                swipeRefresh.isRefreshing = false
            }
    }

    private fun loadPayments() {
        // Firestore listener handles this automatically; swipe-refresh just re-triggers UI
        swipeRefresh.isRefreshing = false
    }
}
