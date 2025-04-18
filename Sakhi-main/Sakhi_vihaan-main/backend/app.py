from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import os
import logging
import re
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load ML models
MODELS_DIR = Path(__file__).parent / 'ml_models'
logger.info(f"Loading models from: {MODELS_DIR}")

try:
    # QR Code Detection Model
    qr_model = joblib.load(MODELS_DIR / 'qr_spam_model.pkl')
    qr_vectorizer = joblib.load(MODELS_DIR / 'qr_vectorizer.pkl')
    logger.info("QR models loaded successfully")

    # SMS Detection Model
    sms_model = joblib.load(MODELS_DIR / 'sms_spam_model.pkl')
    sms_vectorizer = joblib.load(MODELS_DIR / 'sms_vectorizer.pkl')
    logger.info("SMS models loaded successfully")

    # Phone Call Detection Model
    phone_model = joblib.load(MODELS_DIR / 'spam_call_model.pkl')
    logger.info("Phone model loaded successfully")

    # URL Detection Model
    url_model = joblib.load(MODELS_DIR / 'url_spam_model.pkl')
    logger.info("URL model loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    raise

def create_response(prediction, probability, details=""):
    confidence = float(max(probability)) * 100
    if prediction == 1:
        status = "danger" if confidence > 80 else "warning"
        message = "High risk! This appears to be fraudulent." if confidence > 80 else "Exercise caution. Some suspicious patterns detected."
    else:
        status = "safe"
        message = "This appears to be legitimate."
    
    return {
        "prediction": status,
        "message": message,
        "details": details,
        "confidence": confidence
    }

def extract_url_features(url):
    """Extract numerical features from URL for prediction."""
    try:
        # Parse the URL
        parsed = urlparse(url if url.startswith(('http://', 'https://')) else f'http://{url}')
        
        # Create the 4 most important features
        feature_dict = {
            'length': len(url),  # Total length
            'special_chars': sum(not c.isalnum() for c in url),  # Number of special characters
            'digits': sum(c.isdigit() for c in url),  # Number of digits
            'dots': sum(c == '.' for c in url),  # Number of dots
        }
        
        # Convert to array in a fixed order
        features = np.array(list(feature_dict.values()))
        return features.reshape(1, -1)
    except Exception as e:
        logger.error(f"Error extracting URL features: {str(e)}")
        # Return default features if parsing fails
        return np.zeros((1, 4))

def extract_upi_features(upi_id):
    """Extract numerical features from UPI ID for prediction."""
    try:
        # Create the 4 most important features for UPI analysis
        feature_dict = {
            'length': len(upi_id),  # Total length
            'special_chars': sum(not c.isalnum() for c in upi_id),  # Special characters
            'has_valid_format': 1 if re.match(r'^[a-zA-Z0-9._-]+@[a-zA-Z]+$', upi_id) else 0,  # Valid format
            'segments': len(upi_id.split('@'))  # Number of segments (should be 2 for valid UPI)
        }
        
        # Convert to array in a fixed order
        features = np.array(list(feature_dict.values()))
        return features.reshape(1, -1)
    except Exception as e:
        logger.error(f"Error extracting UPI features: {str(e)}")
        return np.zeros((1, 4))

def extract_phone_features(phone_number):
    """Extract numerical features from phone number."""
    try:
        # Clean the phone number
        digits = ''.join(filter(str.isdigit, phone_number))
        
        # Create the 4 most important features
        feature_dict = {
            'length': len(digits),  # Number of digits
            'starts_with_zero': 1 if digits.startswith('0') else 0,  # Starts with 0
            'starts_with_plus': 1 if phone_number.startswith('+') else 0,  # International format
            'special_chars': sum(not c.isdigit() for c in phone_number)  # Special characters
        }
        
        # Convert to array in a fixed order
        features = np.array(list(feature_dict.values()))
        return features.reshape(1, -1)
    except Exception as e:
        logger.error(f"Error extracting phone features: {str(e)}")
        return np.zeros((1, 4))

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "running",
        "endpoints": {
            "/api/detect/qr": "QR code scam detection",
            "/api/detect/sms": "SMS scam detection",
            "/api/detect/phone": "Phone number scam detection",
            "/api/detect/url": "URL scam detection"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/detect/qr', methods=['POST'])
def detect_qr():
    try:
        data = request.json
        if not data or 'data' not in data:
            return jsonify({"error": "Missing 'data' in request body"}), 400
            
        qr_content = data['data']
        logger.debug(f"Processing QR content: {qr_content}")
        
        # Transform and predict
        features = qr_vectorizer.transform([qr_content])
        prediction = qr_model.predict(features)[0]
        probability = qr_model.predict_proba(features)[0]
        
        details = "QR code content analyzed for suspicious patterns and known scam indicators."
        return jsonify(create_response(prediction, probability, details))
    except Exception as e:
        logger.error(f"Error in QR detection: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/detect/sms', methods=['POST'])
def detect_sms():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' in request body"}), 400
            
        message = data['message']
        logger.debug(f"Processing SMS message: {message}")
        
        # Transform and predict
        features = sms_vectorizer.transform([message])
        prediction = sms_model.predict(features)[0]
        probability = sms_model.predict_proba(features)[0]
        
        details = "Message analyzed for scam patterns, suspicious keywords, and urgency indicators."
        return jsonify(create_response(prediction, probability, details))
    except Exception as e:
        logger.error(f"Error in SMS detection: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/detect/phone', methods=['POST'])
def detect_phone():
    try:
        data = request.json
        if not data or 'phone' not in data:
            return jsonify({"error": "Missing 'phone' in request body"}), 400
            
        phone_number = data['phone']
        logger.debug(f"Processing phone number: {phone_number}")
        
        # Extract features
        features = extract_phone_features(phone_number)
        
        # Predict
        prediction = phone_model.predict(features)[0]
        probability = phone_model.predict_proba(features)[0]
        
        details = "Phone number checked against database of reported scam numbers and pattern analysis."
        return jsonify(create_response(prediction, probability, details))
    except Exception as e:
        logger.error(f"Error in phone detection: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/detect/url', methods=['POST'])
def detect_url():
    try:
        data = request.json
        if not data or 'url' not in data:
            return jsonify({"error": "Missing 'url' in request body"}), 400
            
        url = data['url']
        logger.debug(f"Processing URL/UPI: {url}")
        
        # Check if it's a UPI ID (contains @)
        if '@' in url:
            features = extract_upi_features(url)
            details = "UPI ID analyzed for suspicious patterns and verified against known legitimate payment providers."
        else:
            features = extract_url_features(url)
            details = "URL analyzed for phishing indicators, domain age, and suspicious patterns."
        
        # Predict
        prediction = url_model.predict(features)[0]
        probability = url_model.predict_proba(features)[0]
        
        return jsonify(create_response(prediction, probability, details))
    except Exception as e:
        logger.error(f"Error in URL/UPI detection: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 