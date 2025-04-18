import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

interface MLResponse {
  prediction: 'safe' | 'warning' | 'danger';
  message: string;
  details: string;
  confidence: number;
}

// Helper function to check if the server is running
async function checkServerConnection(): Promise<boolean> {
  try {
    await axios.get(BASE_URL);
    return true;
  } catch (error: any) {
    if (error.response) {
      return true;
    }
    return false;
  }
}

// Helper function to handle API calls with retries
async function makeAPICall<T>(endpoint: string, data: any): Promise<T> {
  const isServerRunning = await checkServerConnection();
  if (!isServerRunning) {
    throw new Error('ML server is not running. Please ensure the backend server is started.');
  }

  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMessage = error.response.data?.error || 'Unknown server error';
      throw new Error(`Server error: ${errorMessage}`);
    } else if (error.request) {
      throw new Error('No response from server. Please check if the ML server is running.');
    } else {
      throw new Error('Failed to make request. Please check your connection.');
    }
  }
}

export async function detectQRCode(qrData: string): Promise<MLResponse> {
  return makeAPICall<MLResponse>('/api/detect/qr', { data: qrData });
}

export async function detectSMS(message: string): Promise<MLResponse> {
  return makeAPICall<MLResponse>('/api/detect/sms', { message });
}

export async function detectPhoneNumber(phoneNumber: string): Promise<MLResponse> {
  return makeAPICall<MLResponse>('/api/detect/phone', { phone: phoneNumber });
}

export async function detectURL(url: string): Promise<MLResponse> {
  return makeAPICall<MLResponse>('/api/detect/url', { url });
}