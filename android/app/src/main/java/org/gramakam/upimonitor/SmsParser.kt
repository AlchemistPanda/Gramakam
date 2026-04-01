package org.gramakam.upimonitor

/**
 * Parses Kerala Gramin Bank UPI credit SMS.
 *
 * Sample format:
 * "Dear Customer, Account XXXX061 is credited with INR 240 on 26-03-2026 09:09:40
 *  from sukanyasujith08. UPI Ref. no. 608509887009-Kerala Gramin Bank."
 */
object SmsParser {

    private val PATTERN = Regex(
        """credited with INR\s+([\d,.]+)\s+on\s+([\d\-]+\s+[\d:]+)\s+from\s+(\S+)\.\s+UPI Ref\. no\.\s+(\d+)-(.+)\.""",
        RegexOption.IGNORE_CASE
    )

    fun parse(sms: String): Payment? {
        val match = PATTERN.find(sms) ?: return null
        val amount = match.groupValues[1].replace(",", "").toDoubleOrNull() ?: return null
        return Payment(
            amount = amount,
            datetime = match.groupValues[2].trim(),
            senderUpi = match.groupValues[3].trim(),
            upiRef = match.groupValues[4].trim(),
            bank = match.groupValues[5].trim()
        )
    }
}
