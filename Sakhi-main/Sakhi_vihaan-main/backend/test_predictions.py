import joblib
import numpy as np
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load ML models
MODELS_DIR = Path(__file__).parent / 'ml_models'

def load_models():
    models = {}
    try:
        # QR Code Detection Model
        models['qr_model'] = joblib.load(MODELS_DIR / 'qr_spam_model.pkl')
        models['qr_vectorizer'] = joblib.load(MODELS_DIR / 'qr_vectorizer.pkl')
        
        # SMS Detection Model
        models['sms_model'] = joblib.load(MODELS_DIR / 'sms_spam_model.pkl')
        models['sms_vectorizer'] = joblib.load(MODELS_DIR / 'sms_vectorizer.pkl')
        
        # Phone Call Detection Model
        models['phone_model'] = joblib.load(MODELS_DIR / 'spam_call_model.pkl')
        
        # URL Detection Model
        models['url_model'] = joblib.load(MODELS_DIR / 'url_spam_model.pkl')
        
        logger.info("All models loaded successfully")
        return models
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise

def test_qr_prediction(models, qr_content):
    features = models['qr_vectorizer'].transform([qr_content])
    prediction = models['qr_model'].predict(features)[0]
    probability = models['qr_model'].predict_proba(features)[0]
    return prediction, max(probability)

def test_sms_prediction(models, message):
    features = models['sms_vectorizer'].transform([message])
    prediction = models['sms_model'].predict(features)[0]
    probability = models['sms_model'].predict_proba(features)[0]
    return prediction, max(probability)

def test_phone_prediction(models, phone_number):
    # Extract features
    features = np.array([
        len(phone_number),
        1 if phone_number.startswith('0') else 0,
        1 if phone_number.startswith('+') else 0,
        sum(not c.isdigit() for c in phone_number)
    ]).reshape(1, -1)
    
    prediction = models['phone_model'].predict(features)[0]
    probability = models['phone_model'].predict_proba(features)[0]
    return prediction, max(probability)

def test_url_prediction(models, url):
    # Extract features
    features = np.array([
        len(url),
        sum(not c.isalnum() for c in url),
        sum(c.isdigit() for c in url),
        sum(c == '.' for c in url)
    ]).reshape(1, -1)
    
    prediction = models['url_model'].predict(features)[0]
    probability = models['url_model'].predict_proba(features)[0]
    return prediction, max(probability)

def main():
    # Load models
    models = load_models()
    
    # Test cases
    test_cases = {
        'qr': [
            'https://legitimate-website.com/payment',
            'http://suspicious-scam-site.xyz/phishing'
        ],
        'sms': [
            'Your OTP for bank login is 123456. Valid for 5 mins.',
            'URGENT: Your account has been compromised. Click here to verify: bit.ly/scam'
        ],
        'phone': [
            '+919876543210',
            '9876543210',
            '+1234567890'
        ],
        'url': [
            'https://www.amazon.com',
            'http://suspicious-site.xyz',
            'user@okhdfc'
        ]
    }
    
    # Run tests
    print("\nTesting QR Code Detection:")
    for qr in test_cases['qr']:
        pred, conf = test_qr_prediction(models, qr)
        print(f"Input: {qr}")
        print(f"Prediction: {'Scam' if pred == 1 else 'Safe'}")
        print(f"Confidence: {conf*100:.2f}%\n")
    
    print("\nTesting SMS Detection:")
    for sms in test_cases['sms']:
        pred, conf = test_sms_prediction(models, sms)
        print(f"Input: {sms}")
        print(f"Prediction: {'Scam' if pred == 1 else 'Safe'}")
        print(f"Confidence: {conf*100:.2f}%\n")
    
    print("\nTesting Phone Number Detection:")
    for phone in test_cases['phone']:
        pred, conf = test_phone_prediction(models, phone)
        print(f"Input: {phone}")
        print(f"Prediction: {'Scam' if pred == 1 else 'Safe'}")
        print(f"Confidence: {conf*100:.2f}%\n")
    
    print("\nTesting URL/UPI Detection:")
    for url in test_cases['url']:
        pred, conf = test_url_prediction(models, url)
        print(f"Input: {url}")
        print(f"Prediction: {'Scam' if pred == 1 else 'Safe'}")
        print(f"Confidence: {conf*100:.2f}%\n")

if __name__ == "__main__":
    main() 