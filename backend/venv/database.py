# backend/database.py
import pymongo
from bson.objectid import ObjectId
from flask_login import UserMixin
from config import Config
from datetime import datetime
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

class DB:
    client = None
    db = None

    @staticmethod
    def initialize():
        if DB.client is None:
            try:
                DB.client = pymongo.MongoClient(Config.MONGO_URI)
                DB.db = DB.client.get_database()
                if DB.db is None:
                    raise Exception("MongoDB URI did not specify a database name, or get_database() returned None.")
                print("✅ MongoDB connected successfully!") # Changed print for clarity
            except pymongo.errors.ConnectionFailure as e:
                print(f"❌ Could not connect to MongoDB: {e}") # Changed print for clarity
                DB.client = None
                DB.db = None
            except Exception as e:
                print(f"❌ An unexpected error occurred during MongoDB connection: {e}") # Changed print for clarity
                DB.client = None
                DB.db = None

    @staticmethod
    def get_collection(collection_name):
        if DB.db is None:
            DB.initialize()
            if DB.db is None:
                print(f"WARNING: Could not retrieve collection '{collection_name}' because MongoDB connection failed.")
                return None
        return DB.db[collection_name]

class User(UserMixin):
    def __init__(self, user_data):
        self.user_data = user_data
        self._id = user_data.get('_id')
        self.id = str(self._id)

    def get_id(self):
        return self.id

    def get_email(self):
        return self.user_data.get('email')

    def get_name(self):
        return self.user_data.get('name')
    
    def get_profile_pic(self):
        return self.user_data.get('profile_pic', 'https://via.placeholder.com/32')

    @staticmethod
    def get(user_id):
        users_collection = DB.get_collection('users')
        if users_collection is None:
            return None
        try:
            user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                return User(user_doc)
        except Exception as e:
            print(f"Error retrieving user by ID {user_id}: {e}")
        return None

    @staticmethod
    def get_by_email(email):
        users_collection = DB.get_collection('users')
        if users_collection is None:
            return None
        try:
            user_doc = users_collection.find_one({"email": email})
            if user_doc:
                return User(user_doc)
        except Exception as e:
            print(f"Error retrieving user by email {email}: {e}")
        return None

    @staticmethod
    def create_user(email, password, name):
        users_collection = DB.get_collection('users')
        if users_collection is None:
            return None
        
        if users_collection.find_one({"email": email}):
            raise ValueError("User with this email already exists.")

        try:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user_data = {
                "email": email,
                "password": hashed_password,
                "name": name,
                "profile_pic": 'https://via.placeholder.com/32',
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            }
            result = users_collection.insert_one(new_user_data)
            new_user_data['_id'] = result.inserted_id
            return User(new_user_data)
        except Exception as e:
            print(f"Error creating user {email}: {e}")
            raise
        return None
    
    def check_password(self, password):
        # Ensure 'password' key exists before attempting to check hash
        if 'password' not in self.user_data:
            return False # User object from DB doesn't have a password field
        return bcrypt.check_password_hash(self.user_data['password'], password)

# NEW: Report management functions
class Report:
    @staticmethod
    def save_report_metadata(user_id, file_name, originality, ai_probability, pdf_path):
        reports_collection = DB.get_collection('reports')
        if reports_collection is None:
            return None
        
        report_data = {
            "user_id": ObjectId(user_id),
            "file_name": file_name,
            "originality_score": originality,
            "ai_probability": ai_probability,
            "pdf_report_path": pdf_path,
            "submission_date": datetime.utcnow()
        }
        try:
            result = reports_collection.insert_one(report_data)
            print(f"Report saved for user {user_id}: {file_name}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving report metadata for user {user_id}: {e}")
            return None

    @staticmethod
    def get_user_reports(user_id):
        reports_collection = DB.get_collection('reports')
        if reports_collection is None:
            return []
        try:
            # Sort by submission_date descending
            reports = reports_collection.find({"user_id": ObjectId(user_id)}).sort("submission_date", pymongo.DESCENDING)
            # Convert ObjectId to string and format dates
            formatted_reports = []
            for report in reports:
                report['_id'] = str(report['_id'])
                report['user_id'] = str(report['user_id'])
                report['submission_date'] = report['submission_date'].isoformat() + "Z" # ISO format for JS Date parsing
                formatted_reports.append(report)
            return formatted_reports
        except Exception as e:
            print(f"Error retrieving reports for user {user_id}: {e}")
            return []

    @staticmethod
    def get_total_reports_count(user_id):
        reports_collection = DB.get_collection('reports')
        if reports_collection is None:
            return 0
        try:
            return reports_collection.count_documents({"user_id": ObjectId(user_id)})
        except Exception as e:
            print(f"Error counting reports for user {user_id}: {e}")
            return 0

    @staticmethod
    def get_last_report(user_id):
        reports_collection = DB.get_collection('reports')
        if reports_collection is None:
            return None
        try:
            # Find one report, sorted by date descending (most recent)
            last_report = reports_collection.find_one({"user_id": ObjectId(user_id)}, sort=[("submission_date", pymongo.DESCENDING)])
            if last_report:
                last_report['_id'] = str(last_report['_id'])
                last_report['user_id'] = str(last_report['user_id'])
                last_report['submission_date'] = last_report['submission_date'].isoformat() + "Z"
            return last_report
        except Exception as e:
            print(f"Error retrieving last report for user {user_id}: {e}")
            return None