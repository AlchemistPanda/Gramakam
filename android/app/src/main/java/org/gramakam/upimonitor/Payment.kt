package org.gramakam.upimonitor

data class Payment(
    val amount: Double,
    val datetime: String,
    val senderUpi: String,
    val upiRef: String,
    val bank: String
)
