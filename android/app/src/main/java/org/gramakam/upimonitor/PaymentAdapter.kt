package org.gramakam.upimonitor

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class PaymentAdapter(private val payments: MutableList<PaymentItem> = mutableListOf()) :
    RecyclerView.Adapter<PaymentAdapter.ViewHolder>() {

    data class PaymentItem(
        val amount: Double,
        val senderUpi: String,
        val upiRef: String,
        val datetime: String,
        val bank: String,
        val matched: Boolean
    )

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvAmount: TextView = view.findViewById(R.id.tvAmount)
        val tvSender: TextView = view.findViewById(R.id.tvSender)
        val tvRef: TextView = view.findViewById(R.id.tvRef)
        val tvDatetime: TextView = view.findViewById(R.id.tvDatetime)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_payment, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = payments[position]
        holder.tvAmount.text = "₹${item.amount}"
        holder.tvSender.text = "From: ${item.senderUpi}"
        holder.tvRef.text = "Ref: ${item.upiRef}"
        holder.tvDatetime.text = "${item.datetime} • ${item.bank}"
        holder.tvStatus.text = if (item.matched) "Matched" else "Unmatched"
        holder.tvStatus.setTextColor(
            if (item.matched) 0xFF2E7D32.toInt() else 0xFFE65100.toInt()
        )
    }

    override fun getItemCount() = payments.size

    fun updatePayments(newPayments: List<PaymentItem>) {
        payments.clear()
        payments.addAll(newPayments)
        notifyDataSetChanged()
    }
}
