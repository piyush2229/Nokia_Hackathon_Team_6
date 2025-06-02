# backend/database.py

import pymongo
from bson.objectid import ObjectId
from flask_login import UserMixin
from config import Config
from datetime import datetime
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()  # Initialize Bcrypt for password hashing


class DB:
    client = None
    db = None

    @staticmethod
    def initialize():
        if DB.client is None:
            try:
                DB.client = pymongo.MongoClient(Config.MONGO_URI)
                DB.db = DB.client.get_default_database()  # Will use DB name from URI
                if DB.db is None:
                    raise Exception("MongoDB URI must include a database name.")
                print("✅ MongoDB connected successfully!")
            except pymongo.errors.ConnectionFailure as e:
                print(f"❌ Could not connect to MongoDB: {e}")
                DB.client = None
                DB.db = None
            except Exception as e:
                print(f"❌ Unexpected error during MongoDB connection: {e}")
                DB.client = None
                DB.db = None

    @staticmethod
    def get_collection(collection_name):
        if DB.db is None:
            DB.initialize()
            if DB.db is None:
                print(f"⚠️ WARNING: Could not retrieve collection '{collection_name}' because MongoDB connection failed.")
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
            print(f"❌ Error retrieving user by ID {user_id}: {e}")
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
            print(f"❌ Error retrieving user by email {email}: {e}")
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
            print(f"❌ Error creating user {email}: {e}")
            raise

    @staticmethod
    def create_or_update(google_id, email, name, profile_pic=None):
        users_collection = DB.get_collection('users')
        if users_collection is None:
            return None

        try:
            existing_user = users_collection.find_one({"google_id": google_id})
            if existing_user:
                users_collection.update_one(
                    {"google_id": google_id},
                    {"$set": {"email": email, "name": name, "profile_pic": profile_pic, "last_login": datetime.utcnow()}}
                )
                return User(existing_user)
            else:
                new_user = {
                    "google_id": google_id,
                    "email": email,
                    "name": name,
                    "profile_pic": profile_pic,
                    "created_at": datetime.utcnow(),
                    "last_login": datetime.utcnow()
                }
                result = users_collection.insert_one(new_user)
                new_user['_id'] = result.inserted_id
                return User(new_user)
        except Exception as e:
            print(f"❌ Error in create_or_update: {e}")
            return None

    def check_password(self, password):
        return bcrypt.check_password_hash(self.user_data['password'], password)
