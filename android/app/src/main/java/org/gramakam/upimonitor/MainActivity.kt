package org.gramakam.upimonitor

import android.Manifest
import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
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
        private const val PERMISSION_CODE = 100
    }

    private lateinit var adapter: PaymentAdapter
    private lateinit var tvStatus: TextView
    private lateinit var tvCount: TextView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var viewIndicator: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        tvCount = findViewById(R.id.tvCount)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        viewIndicator = findViewById(R.id.viewStatusIndicator)

        val recyclerView = findViewById<RecyclerView>(R.id.recyclerPayments)
        adapter = PaymentAdapter()
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        swipeRefresh.setColorSchemeColors(0xFF800020.toInt())
        swipeRefresh.setOnRefreshListener { 
            // Snaps are real-time, just showing refresh for visual feedback
            swipeRefresh.isRefreshing = false 
        }

        // Request permissions
        checkPermissions()

        // Listen for real-time updates
        listenToPayments()

        // Active indicator pulse
        startPulseAnimation()

        // Admin Simulation: Long click on Count to simulate a transaction
        tvCount.setOnLongClickListener {
            simulatePayment()
            true
        }
    }

    private fun startPulseAnimation() {
        val pulse = ObjectAnimator.ofPropertyValuesHolder(
            viewIndicator,
            PropertyValuesHolder.ofFloat("scaleX", 1.2f),
            PropertyValuesHolder.ofFloat("scaleY", 1.2f),
            PropertyValuesHolder.ofFloat("alpha", 0.6f)
        )
        pulse.duration = 1000
        pulse.repeatCount = ObjectAnimator.INFINITE
        pulse.repeatMode = ObjectAnimator.REVERSE
        pulse.start()
    }

    private fun checkPermissions() {
        val perms = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        
        val needed = perms.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_CODE)
        } else {
            onPermissionsReady()
        }
    }

    private fun onPermissionsReady() {
        tvStatus.text = "Listening for bank SMS..."
        tvStatus.setTextColor(0xFF2E7D32.toInt())
        viewIndicator.setBackgroundColor(0xFF2E7D32.toInt())
        MonitoringService.start(this)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                onPermissionsReady()
            } else {
                tvStatus.text = "Permissions denied. Tap to fix."
                tvStatus.setTextColor(0xFFD32F2F.toInt())
                viewIndicator.setBackgroundColor(0xFFD32F2F.toInt())
                
                tvStatus.setOnClickListener {
                    openAppSettings()
                }
            }
        }
    }

    private fun openAppSettings() {
        val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = android.net.Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
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

    private fun simulatePayment() {
        val testSms = "Dear Customer, Account XXXX061 is credited with INR ${ (100..5000).random() } on 26-03-2026 09:09:40 from sukanyasujith08 @test. UPI Ref. no. ${ (1000000..9999999).random() }-Test Bank."
        val payment = SmsParser.parse(testSms)
        if (payment != null) {
            FirestoreService.pushPayment(payment, testSms)
            Toast.makeText(this, "Test transaction simulated!", Toast.LENGTH_SHORT).show()
        }
    }
}
