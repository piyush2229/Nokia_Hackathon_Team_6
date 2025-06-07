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
import random
import string
from captcha.image import ImageCaptcha
from io import BytesIO

# Add the directory containing core_detector.py to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import configuration and database
from config import Config
from database import DB, User, Report, bcrypt

# Import the analyse function from your core_detector script
try:
    from core_detector import analyse
    print("Successfully imported analyse function from core_detector.py.")
except ImportError as e:
    print(f"Error importing analyse function: {e}")
    print("Please ensure core_detector.py is in the same directory as app.py and its dependencies are installed.")
    sys.exit(1)


# --- Create Flask app instance and load config ---
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

@login_manager.unauthorized_handler
def unauthorized():
    if request.is_json or (request.accept_mimetypes.best_match(['application/json', 'text/html']) == 'application/json' and not request.path.startswith('/auth')):
        return jsonify({"error": "Authentication required"}), 401
    return redirect("http://localhost:5173/auth")

DB.initialize()

# --- Auth Blueprint Routes ---
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/captcha', methods=['GET'])
def get_captcha():
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    session['captcha_text'] = chars
    image = ImageCaptcha(width=280, height=90)
    data = image.generate(chars)
    return send_file(BytesIO(data.read()), mimetype='image/png')

def handle_auth_request(is_register=False):
    """Refactored function to handle both login and registration requests."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request format. JSON is required."}), 400
    except Exception:
        return jsonify({"error": "Invalid request format. Could not parse JSON."}), 400

    email = data.get('email')
    password = data.get('password')
    captcha_input = data.get('captchaInput')
    name = data.get('name') if is_register else None

    # CAPTCHA Verification using session
    correct_captcha = session.pop('captcha_text', None)
    if not correct_captcha or not captcha_input or captcha_input.upper() != correct_captcha.upper():
        return jsonify({"error": "Invalid CAPTCHA. Please try again."}), 400

    # Fields validation
    required_fields = [email, password]
    if is_register:
        required_fields.append(name)
    
    if not all(required_fields):
        return jsonify({"error": "Missing one or more required fields"}), 400
    
    if is_register and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email format"}), 400

    # Execute registration or login
    if is_register:
        try:
            user = User.create_user(email, password, name)
            login_user(user) 
            return jsonify({"message": "User registered successfully", "user": {"id": user.id, "email": user.get_email(), "name": user.get_name()}}), 201
        except ValueError as e: # Handles existing user
            return jsonify({"error": str(e)}), 409
        except Exception as e:
            print(f"Registration error: {e}")
            return jsonify({"error": f"An error occurred during registration: {str(e)}"}), 500
    else: # Login
        user = User.get_by_email(email)
        if user and user.check_password(password):
            login_user(user)
            return jsonify({"message": "Logged in successfully", "user": {"id": user.id, "email": user.get_email(), "name": user.get_name()}}), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401


@auth_bp.route('/register', methods=['POST'])
def register():
    return handle_auth_request(is_register=True)

@auth_bp.route('/login', methods=['POST'])
def login_route():
    return handle_auth_request(is_register=False)


@auth_bp.route('/logout')
@login_required
def logout_route():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

app.register_blueprint(auth_bp)

# --- User Info and other API Routes (Unchanged) ---
@app.route('/@me')
def me():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'name': current_user.get_name(),
            'email': current_user.get_email(),
            'profile_pic': current_user.get_profile_pic(),
            'is_authenticated': True
        })
    return jsonify({'is_authenticated': False, 'error': 'Not authenticated'}), 401


@app.route('/api/dashboard_stats', methods=['GET'])
@login_required
def dashboard_stats():
    user_id = current_user.id
    total_reports = Report.get_total_reports_count(user_id)
    last_report = Report.get_last_report(user_id)
    if last_report and 'pdf_report_path' in last_report:
        last_report['pdf_file_name'] = os.path.basename(last_report['pdf_report_path'])
        del last_report['pdf_report_path']
    return jsonify({ "total_reports": total_reports, "last_checked_document": last_report }), 200


@app.route('/api/history', methods=['GET'])
@login_required
def get_history():
    user_id = current_user.id
    reports = Report.get_user_reports(user_id)
    for report in reports:
        if 'pdf_report_path' in report:
            report['pdf_file_name'] = os.path.basename(report['pdf_report_path'])
            del report['pdf_report_path']
    return jsonify(reports), 200

def save_uploaded_file(file_obj):
    if not file_obj: return None
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
        raise

@app.route('/analyse', methods=['POST'])
@login_required
def run_analysis():
    main_text_input = request.form.get('main_text')
    main_file_obj = request.files.get('main_file')
    comparison_text_input = request.form.get('comparison_text')
    comparison_file_obj = request.files.get('comparison_file')
    if not (main_text_input or main_file_obj):
        return jsonify({"error": "No main text or file provided for analysis"}), 400
    main_temp_file_path, comparison_temp_file_path = None, None
    try:
        if main_file_obj: main_temp_file_path = save_uploaded_file(main_file_obj)
        if comparison_file_obj: comparison_temp_file_path = save_uploaded_file(comparison_file_obj)
        main_file_arg = {'name': main_temp_file_path} if main_temp_file_path else None
        comparison_file_arg = {'name': comparison_temp_file_path} if comparison_temp_file_path else None
        cite_txt, originality_score, ai_probability, pdf_report_path = analyse(main_txt=main_text_input, main_file=main_file_arg, comparison_txt=comparison_text_input, comparison_file=comparison_file_arg)
        file_name_for_history = main_file_obj.filename if main_file_obj else "Text Input"
        Report.save_report_metadata(current_user.id, file_name_for_history, originality_score, ai_probability, pdf_report_path)
        response_data = { "citations": cite_txt.split('\n') if cite_txt != "No overlaps." else ["No overlaps."], "originality": originality_score, "aiProbability": ai_probability, "pdfReportPath": pdf_report_path }
        return jsonify(response_data)
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500
    finally:
        if main_temp_file_path and os.path.exists(main_temp_file_path): os.unlink(main_temp_file_path)
        if comparison_temp_file_path and os.path.exists(comparison_temp_file_path): os.unlink(comparison_temp_file_path)

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