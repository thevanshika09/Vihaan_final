"use client"

import styles from "@/styles/scan/ScanResult.module.css"
import { reportScam } from "@/lib/scamReports"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ScanResultProps {
  result: {
    status: "safe" | "warning" | "danger"
    message: string
    details: string
    confidence: number
  }
  scanType: "qr" | "upi" | "phone" | "url" | "message"
  inputValue: string
  onScanAgain: () => void
}

export default function ScanResult({ result, scanType, inputValue, onScanAgain }: ScanResultProps) {
  const [isReporting, setIsReporting] = useState(false)
  const router = useRouter()

  const handleReportScam = async () => {
    setIsReporting(true)
    try {
      const reportResult = await reportScam({
        scanType,
        inputValue,
        status: result.status,
        message: result.message,
        details: result.details,
        confidence: result.confidence
      })

      if (reportResult.success) {
        // Redirect to report page with success message
        router.push('/report?success=true')
      } else {
        alert('Failed to report scam. Please try again.')
      }
    } catch (error) {
      console.error('Error reporting scam:', error)
      alert('An error occurred while reporting the scam.')
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <div className={`${styles.resultContainer} ${styles[result.status]}`}>
      <div className={styles.resultHeader}>
        <div className={styles.resultIcon}>
          {result.status === "safe" && "✅"}
          {result.status === "warning" && "⚠️"}
          {result.status === "danger" && "❌"}
        </div>

        <div className={styles.resultTitle}>
          {result.status === "safe" && "Safe to Proceed"}
          {result.status === "warning" && "Proceed with Caution"}
          {result.status === "danger" && "Potential Fraud Detected"}
        </div>
      </div>

      <div className={styles.resultMessage}>{result.message}</div>

      <div className={styles.resultDetails}>
        <div className={styles.detailsCard}>
          <div className={styles.detailsHeader}>Scan Details</div>

          <div className={styles.detailsContent}>
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Type:</div>
              <div className={styles.detailValue}>
                {scanType === "qr" && "QR Code"}
                {scanType === "upi" && "UPI ID"}
                {scanType === "phone" && "Phone Number"}
                {scanType === "url" && "URL"}
                {scanType === "message" && "Message"}
              </div>
            </div>

            {inputValue && (
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Value:</div>
                <div className={styles.detailValue}>
                  {inputValue.length > 30 ? inputValue.substring(0, 30) + "..." : inputValue}
                </div>
              </div>
            )}

            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Analysis:</div>
              <div className={styles.detailValue}>{result.details}</div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>AI Confidence:</div>
              <div className={styles.detailValue}>{result.confidence}%</div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Scan Time:</div>
              <div className={styles.detailValue}>{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.resultActions}>
        <button className={styles.scanAgainButton} onClick={() => router.push('/scan')}>
          Back to Scan
        </button>
        <button 
          className={styles.reportButton} 
          onClick={handleReportScam}
          disabled={isReporting}
        >
          {isReporting ? 'Reporting...' : 'Report Scam'}
        </button>
        <button className={styles.scanAgainButton} onClick={onScanAgain}>
          Scan Again
        </button>
      </div>

      {result.status === "danger" && (
        <div className={styles.reportSection}>
          <p>This appears to be a potential scam. Please report it to help protect others.</p>
        </div>
      )}
    </div>
  )
}
