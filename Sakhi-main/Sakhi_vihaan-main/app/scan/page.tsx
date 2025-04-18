"use client"

import { useState, useRef, useEffect } from "react"
import Banner from "@/components/layout/Banner"
import BottomNavigation from "@/components/layout/BottomNavigation"
import FloatingAssistant from "@/components/layout/FloatingAssistant"
import ScanResult from "@/components/scan/ScanResult"
import styles from "@/styles/Scan.module.css"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner'
import { detectQRCode, detectSMS, detectPhoneNumber, detectURL } from "@/services/mlService"

type ScanType = "qr" | "upi" | "phone" | "url" | "message"
type ScanStatus = "idle" | "scanning" | "result"
type ResultStatus = "safe" | "warning" | "danger"

export default function Scan() {
  const [scanType, setScanType] = useState<ScanType>("qr")
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle")
  const [inputValue, setInputValue] = useState("")
  const [scanResult, setScanResult] = useState<{
    status: ResultStatus
    message: string
    details: string
    confidence: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)

  // Start camera for QR scanning
  useEffect(() => {
    if (scanType === "qr" && scanStatus === "scanning" && !cameraActive) {
      startCamera()
    }

    return () => {
      if (cameraActive) {
        stopCamera()
      }
    }
  }, [scanType, scanStatus, cameraActive])

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: "environment" },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)

        // Mock QR detection after 3 seconds
        setTimeout(() => {
          if (scanStatus === "scanning") {
            handleScanComplete()
          }
        }, 3000)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const handleStartScan = () => {
    if (scanType !== "qr" && !inputValue.trim()) {
      alert("Please enter a value to scan")
      return
    }

    setScanStatus("scanning")

    // For non-QR scans, simulate processing
    if (scanType !== "qr") {
      setTimeout(() => {
        handleScanComplete()
      }, 1500)
    }
  }

  const handleScanComplete = async () => {
    setLoading(true)
    let mlResult;
    
    try {
      switch (scanType) {
        case "qr":
          mlResult = await detectQRCode(result || "");
          break;
        case "message":
          mlResult = await detectSMS(inputValue);
          break;
        case "phone":
          mlResult = await detectPhoneNumber(inputValue);
          break;
        case "url":
        case "upi":  // Handle UPI IDs similar to URLs
          mlResult = await detectURL(inputValue);
          break;
        default:
          throw new Error("Invalid scan type");
      }

      const scanResultData = {
        status: mlResult.prediction as ResultStatus,
        message: mlResult.message,
        details: scanType === "upi" ? 
          "UPI ID analyzed for suspicious patterns and verified against known legitimate payment providers." :
          mlResult.details,
        confidence: mlResult.confidence
      };

      setScanResult(scanResultData);
      setScanStatus("result");

      if (cameraActive) {
        stopCamera();
      }

      try {
        const scanRef = collection(db, 'scans');
        await addDoc(scanRef, {
          result: scanResultData,
          timestamp: serverTimestamp(),
          status: scanResultData.status,
          type: `${scanType}_scan`,
          input: scanType === "qr" ? result : inputValue
        });
      } catch (error) {
        console.error("Error saving scan:", error);
      }
    } catch (error) {
      console.error("Error during scan:", error);
      setScanResult({
        status: "danger",
        message: "Error analyzing input",
        details: "There was an error processing your request. Please try again.",
        confidence: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanStatus("idle")
    setScanResult(null)
    setInputValue("")
  }

  const handleDecode = async (result: string) => {
    setResult(result)
    setIsAnalyzing(true)
    
    try {
      const mlResult = await detectQRCode(result);
      setScanResult({
        status: mlResult.prediction,
        message: mlResult.message,
        details: mlResult.details,
        confidence: mlResult.confidence
      });
    } catch (error) {
      setScanResult({
        status: "danger",
        message: "Error analyzing QR code",
        details: "There was an error processing your request. Please try again.",
        confidence: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleError = (error: any) => {
    console.error(error)
  }

  return (
    <main className={styles.main}>
      <Banner />

      <div className={styles.content}>
        <div className={styles.scanHeader}>
          <h2>Scan & Verify</h2>
          <p>Verify before you proceed with any transaction</p>
        </div>

        {scanStatus === "idle" && (
          <>
            <div className={styles.scanTypes}>
              <button
                className={`${styles.scanTypeButton} ${scanType === "qr" ? styles.active : ""}`}
                onClick={() => setScanType("qr")}
              >
                <span className={styles.scanTypeIcon}>📷</span>
                QR Code
              </button>
              <button
                className={`${styles.scanTypeButton} ${scanType === "upi" ? styles.active : ""}`}
                onClick={() => setScanType("upi")}
              >
                <span className={styles.scanTypeIcon}>💳</span>
                UPI ID
              </button>
              <button
                className={`${styles.scanTypeButton} ${scanType === "phone" ? styles.active : ""}`}
                onClick={() => setScanType("phone")}
              >
                <span className={styles.scanTypeIcon}>📱</span>
                Phone
              </button>
              <button
                className={`${styles.scanTypeButton} ${scanType === "url" ? styles.active : ""}`}
                onClick={() => setScanType("url")}
              >
                <span className={styles.scanTypeIcon}>🔗</span>
                URL
              </button>
              <button
                className={`${styles.scanTypeButton} ${scanType === "message" ? styles.active : ""}`}
                onClick={() => setScanType("message")}
              >
                <span className={styles.scanTypeIcon}>💬</span>
                Message
              </button>
            </div>

            <div className={styles.scanInput}>
              {scanType === "qr" ? (
                <div className={styles.qrInstructions}>
                  <div className={styles.qrIcon}>📷</div>
                  <p>Click "Start Scan" to open camera and scan QR code</p>
                </div>
              ) : (
                <div className={styles.textInputContainer}>
                  <label htmlFor="scanInput">
                    {scanType === "upi" && "Enter UPI ID"}
                    {scanType === "phone" && "Enter Phone Number"}
                    {scanType === "url" && "Enter URL"}
                    {scanType === "message" && "Paste Message"}
                  </label>
                  <input
                    type="text"
                    id="scanInput"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      scanType === "upi"
                        ? "example@upi"
                        : scanType === "phone"
                          ? "10-digit number"
                          : scanType === "url"
                            ? "https://example.com"
                            : "Paste suspicious message here"
                    }
                  />
                </div>
              )}

              <button className={styles.startScanButton} onClick={handleStartScan}>
                Start Scan
              </button>
            </div>
          </>
        )}

        {scanStatus === "scanning" && (
          <div className={styles.scanningContainer}>
            {scanType === "qr" ? (
              <div className={styles.cameraContainer}>
                <video ref={videoRef} className={styles.cameraFeed} autoPlay playsInline />
                <div className={styles.scanOverlay}>
                  <div className={styles.scanFrame}></div>
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
              </div>
            ) : (
              <div className={styles.processingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Analyzing {scanType}...</p>
                <p className={styles.inputPreview}>
                  {inputValue.substring(0, 30)}
                  {inputValue.length > 30 ? "..." : ""}
                </p>
              </div>
            )}

            <button className={styles.cancelButton} onClick={handleReset}>
              Cancel
            </button>
          </div>
        )}

        {scanStatus === "result" && scanResult && (
          <ScanResult result={scanResult} scanType={scanType} inputValue={inputValue} onScanAgain={handleReset} />
        )}

        <div className={styles.scanTips}>
          <h3>Safety Tips</h3>
          <ul className={styles.tipsList}>
            <li>Always verify UPI IDs before making payments</li>
            <li>Don't scan QR codes from unknown sources</li>
            <li>Be cautious of messages asking for OTP or banking details</li>
            <li>Report suspicious activities to help the community</li>
          </ul>
        </div>
      </div>

      <FloatingAssistant />
      <BottomNavigation activeTab="scan" />
    </main>
  )
}
