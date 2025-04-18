import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ScamReport {
  scanType: 'qr' | 'upi' | 'phone' | 'url' | 'message';
  inputValue: string;
  status: 'safe' | 'warning' | 'danger';
  message: string;
  details: string;
  confidence: number;
  reportedAt: Date;
  userId?: string;
}

export async function reportScam(report: Omit<ScamReport, 'reportedAt'>) {
  try {
    // Add the report to the appropriate collection based on scan type
    const collectionName = `scam_reports_${report.scanType}`;
    const docRef = await addDoc(collection(db, collectionName), {
      ...report,
      reportedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error reporting scam:', error);
    return { success: false, error };
  }
} 