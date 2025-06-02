# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key_for_dev')
    MONGO_URI = os.getenv('MONGO_URI')
    # GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID') # Removed
    # GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET') # Removed
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') # For Generative AI
    SERPER_API_KEY = os.getenv('SERPER_API_KEY') # For web search
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

    if not all([SECRET_KEY, MONGO_URI, GOOGLE_API_KEY, SERPER_API_KEY]):
        print("WARNING: One or more critical environment variables (FLASK_SECRET_KEY, MONGO_URI, GOOGLE_API_KEY, SERPER_API_KEY) are not set. Check your .env file.")