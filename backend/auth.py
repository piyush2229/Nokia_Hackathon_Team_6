# backend/auth.py
from flask import Blueprint, redirect, url_for, session, current_app, jsonify, request
from authlib.integrations.flask_client import OAuth
from flask_login import login_user, logout_user
from database import DB, User
from config import Config
import secrets # Import secrets module for generating nonce

auth_bp = Blueprint('auth', __name__)
oauth = OAuth()

@auth_bp.record_once
def record_setup(state):
    oauth.register(
        name='google',
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        client_kwargs={'scope': 'openid email profile'},
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
    )

@auth_bp.route('/login')
def login():
    redirect_uri = url_for('auth.authorize', _external=True)
    # Generate a unique nonce for this request and store it in the session
    nonce = secrets.token_urlsafe(32) # Generate a secure random string for nonce
    session['google_oauth_nonce'] = nonce # Store it in the session
    
    # Pass the nonce in the authorize_redirect call
    return oauth.google.authorize_redirect(redirect_uri, nonce=nonce) # Pass the generated nonce

@auth_bp.route('/callback')
def authorize():
    # Retrieve the nonce from the session
    nonce_from_session = session.pop('google_oauth_nonce', None) # Remove it after use
    if nonce_from_session is None:
        current_app.logger.error("Google OAuth callback: Nonce not found in session or already used.")
        return jsonify({"error": "Authentication failed: Nonce missing or session expired."}), 400

    try:
        # Pass the retrieved nonce to authorize_access_token or parse_id_token
        # Authlib's authorize_access_token should correctly use it if passed.
        token = oauth.google.authorize_access_token()
        
        # Now explicitly pass the nonce to parse_id_token for validation
        userinfo = oauth.google.parse_id_token(token, nonce=nonce_from_session) # <-- Pass nonce here

        # Check if userinfo contains necessary data
        if not userinfo or 'email' not in userinfo or 'sub' not in userinfo:
            current_app.logger.error(f"Google OAuth callback: Missing user info. Userinfo: {userinfo}")
            return jsonify({"error": "Failed to get user info from Google."}), 400

        # Retrieve user data from Google
        google_id = userinfo['sub']
        email = userinfo['email']
        name = userinfo.get('name', email)
        profile_pic = userinfo.get('picture')

        # Create or update user in MongoDB
        user = User.create_or_update(google_id, email, name, profile_pic)

        if user:
            login_user(user)
            return redirect("http://localhost:3000/")
        else:
            return jsonify({"error": "User could not be created or retrieved."}), 500

    except Exception as e:
        current_app.logger.error(f"Google OAuth callback failed: {e}")
        # Consider logging the full traceback for more detail in debug mode
        # import traceback
        # if current_app.debug:
        #     current_app.logger.error(traceback.format_exc())
        return jsonify({"error": f"Authentication failed: {str(e)}"}), 500

@auth_bp.route('/logout')
def logout():
    logout_user()
    if 'google_oauth_token' in session:
        session.pop('google_oauth_token')
    # Also ensure to clear any nonce from session on logout for robustness
    if 'google_oauth_nonce' in session:
        session.pop('google_oauth_nonce')
    return redirect("http://localhost:3000/login")

@auth_bp.route('/@me')
def me():
    from flask_login import current_user
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'name': current_user.get_name(),
            'email': current_user.get_email(),
            'profile_pic': current_user.get_profile_pic(),
            'is_authenticated': True
        })
    return jsonify({'is_authenticated': False}), 401