# backend/app.py
import os
import sys
import io
import tempfile
from flask import Flask, request, jsonify, send_file, redirect, url_for, session, Blueprint
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user, login_user, logout_user
from datetime import timedelta
from flask_bcrypt import Bcrypt
import re

# Add the directory containing core_detector.py to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import configuration and database
from config import Config
from database import DB, User, bcrypt

# Import the analyse function from your core_detector script
try:
    from core_detector import analyse
    print("Successfully imported analyse function from core_detector.py.")
except ImportError as e:
    print(f"Error importing analyse function: {e}")
    print("Please ensure core_detector.py is in the same directory as app.py and its dependencies are installed.")
    sys.exit(1)


# --- IMPORTANT: Create Flask app instance and load config FIRST ---
app = Flask(__name__)
app.config.from_object(Config)

# Initialize Bcrypt with the app instance
bcrypt.init_app(app)

# Configure CORS: Allow cookies and specific origin
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5173"])

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# Configure session cookie duration
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=7)

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# Redirect unauthenticated requests to login page for protected views
# This function is called by Flask-Login if login_required fails
@login_manager.unauthorized_handler
def unauthorized():
    # If a protected API route is accessed without login, return 401 JSON
    if request.blueprint == 'auth' or request.path.startswith('/analyse') or request.path.startswith('/download-report'):
        return jsonify({"error": "Authentication required"}), 401
    # For UI routes, you might redirect
    return redirect("http://localhost:3000/auth") # Redirect to frontend auth page

DB.initialize()

# --- Auth Blueprint Routes ---
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not all([email, password, name]):
        return jsonify({"error": "Missing email, password, or name"}), 400
    
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email format"}), 400

    try:
        user = User.create_user(email, password, name)
        if user:
            # Optionally log in user immediately after registration
            login_user(user) 
            return jsonify({"message": "User registered successfully", "user": {"id": user.id, "email": user.get_email(), "name": user.get_name()}}), 201
        else:
            return jsonify({"error": "Failed to register user"}), 500
    except ValueError as e:
        return jsonify({"error": str(e)}), 409 # 409 Conflict for existing user
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": f"An error occurred during registration: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login_route(): # Renamed to avoid conflict with login_user function
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    user = User.get_by_email(email)
    if user and user.check_password(password):
        login_user(user)
        return jsonify({"message": "Logged in successfully", "user": {"id": user.id, "email": user.get_email(), "name": user.get_name()}}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/logout')
@login_required # Ensure user is logged in to logout
def logout_route(): # Renamed to avoid conflict with logout_user function
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# Register authentication blueprint
app.register_blueprint(auth_bp)

# --- User Info Route (NOT part of blueprint's prefix) ---
@app.route('/@me') # This route is now at the root, not /api/auth/@me
def me():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'name': current_user.get_name(),
            'email': current_user.get_email(),
            'profile_pic': current_user.get_profile_pic(),
            'is_authenticated': True
        })
    return jsonify({'is_authenticated': False, 'error': 'Not authenticated'}), 401 # Return JSON error for frontend


# --- File Handling & Analysis Routes ---

def save_uploaded_file(file_obj):
    if not file_obj:
        return None
    try:
        suffix_map = {
            'application/pdf': '.pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/msword': '.doc',
            'text/plain': '.txt',
        }
        file_suffix = suffix_map.get(file_obj.content_type, '.tmp')

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix)
        file_obj.save(temp_file.name)
        temp_file.close()
        return temp_file.name
    except Exception as e:
        print(f"Error saving file: {e}")
        raise # Re-raise to be caught by the outer try-except
        
@app.route('/analyse', methods=['POST'])
@login_required # Protect this route: requires login
def run_analysis():
    main_text_input = request.form.get('main_text')
    main_file_obj = request.files.get('main_file')
    
    comparison_text_input = request.form.get('comparison_text')
    comparison_file_obj = request.files.get('comparison_file')

    if not (main_text_input or main_file_obj):
        return jsonify({"error": "No main text or file provided for analysis"}), 400

    main_temp_file_path = None
    comparison_temp_file_path = None
    
    try:
        if main_file_obj:
            main_temp_file_path = save_uploaded_file(main_file_obj)
        
        if comparison_file_obj:
            comparison_temp_file_path = save_uploaded_file(comparison_file_obj)

        main_file_arg = {'name': main_temp_file_path} if main_temp_file_path else None
        comparison_file_arg = {'name': comparison_temp_file_path} if comparison_temp_file_path else None

        cite_txt, originality_score, ai_probability, pdf_report_path = analyse(
            main_txt=main_text_input,
            main_file=main_file_arg,
            comparison_txt=comparison_text_input,
            comparison_file=comparison_file_arg
        )

        response_data = {
            "citations": cite_txt.split('\n') if cite_txt != "No overlaps." else ["No overlaps."],
            "originality": originality_score,
            "aiProbability": ai_probability,
            "pdfReportPath": pdf_report_path
        }
        return jsonify(response_data)

    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500
    finally:
        if main_temp_file_path and os.path.exists(main_temp_file_path):
            os.unlink(main_temp_file_path)
        if comparison_temp_file_path and os.path.exists(comparison_temp_file_path):
            os.unlink(comparison_temp_file_path)

@app.route('/download-report/<path:filename>', methods=['GET'])
@login_required
def download_report(filename):
    full_path = os.path.join(tempfile.gettempdir(), os.path.basename(filename))
    
    if os.path.exists(full_path):
        return send_file(full_path, as_attachment=True, download_name="plagiarism_report.pdf", mimetype='application/pdf')
    else:
        return jsonify({"error": "File not found"}), 404

if __name__ == '__main__':
    print("Starting Flask backend...")
    app.run(debug=True, port=5000)