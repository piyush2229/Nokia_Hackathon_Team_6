# Plagiarism and AI Content Detector (Nokia_Hackathon)

## 1. Project Overview

This web application detects plagiarism by comparing submitted text against web
sources and also estimates the probability of the content being AI generated.
Users can register, sign in and review past reports which are available for
download as PDFs.

### Directory structure

```
backend/   # Flask application
  app.py   # entry point
  venv/    # contains application modules and requirements.txt
frontend/  # React/Vite user interface
```

## 2. Features

*   **User Management:**
    *   User registration and login.
    *   Secure authentication using session cookies (via Flask-Login).
*   **Core Analysis:**
    *   Plagiarism detection for uploaded files (.txt, .pdf, .docx) or direct text input.
    *   Comparison against web sources using Google Search.
    *   AI-generated content probability estimation using Google Gemini.
*   **Reporting:**
    *   Detailed analysis reports including:
        *   Originality score.
        *   AI probability score with reasoning.
        *   Top keywords extracted from the document.
        *   Search queries generated and used for web search.
        *   List of detected overlaps with source URLs and similarity scores.
    *   Downloadable PDF reports of the analysis.
*   **User Dashboard & History:**
    *   Dashboard displaying user statistics (e.g., total reports generated, last checked document).
    *   History page listing all past analysis reports for the logged-in user.
*   **User Profile:**
    *   Basic user profile display page.
*   **User Interface:**
    *   Responsive UI built with React.

## 🧩 3. Architecture Diagram

The following diagram outlines the core workflow of the system:

![Architecture Diagram](./assets/architecture.png)

### 🔄 Workflow Summary:

1. **User Input** (text or file) is submitted.
2. **Text Extraction** parses the input.
3. **Query Generation** creates search terms.
4. **Web Search & Scraping** fetches relevant sources.
5. **Plagiarism Detection** compares scraped data.
6. **AI Detection** assesses AI generation likelihood.
7. **PDF Report** is generated with full analysis.
8. **UI Output** presents the report and metrics to the user.

---

## 4. Tech Stack

**Backend:**
*   **Language:** Python
*   **Framework:** Flask
*   **Database:** MongoDB (using PyMongo)
*   **Authentication:** Flask-Login, Flask-Bcrypt
*   **APIs & Services:**
    *   Google Generative AI (Gemini for embeddings, AI detection, query generation)
    *   Serper API (for Google search results)
*   **Core Logic Libraries:**
    *   NLTK (text processing, keyword extraction)
    *   pdfminer.six (PDF text extraction)
    *   python-docx (DOCX text extraction)
    *   ReportLab (PDF report generation)
    *   BeautifulSoup4 (web scraping for source content)
    *   RapidFuzz (fuzzy string matching for plagiarism)
*   **Other:** python-dotenv (environment variable management)

**Frontend:**
*   **Language:** JavaScript
*   **Library/Framework:** React
*   **Build Tool:** Vite
*   **Routing:** React Router
*   **State Management:** React Context (used for `useAuth` and `usePlagiarismCheck` hooks)
*   **Styling:** CSS (custom styles, no specific framework noted)
*   **Other:** `js-cookie` (though potentially not strictly needed for auth due to Flask-Login's HTTP-only cookies, it might be used or was planned).

**General:**
*   **Version Control:** Git

## 5. Prerequisites

*   **Node.js and npm** (or yarn) for the frontend.
*   **Python 3** (e.g., 3.8+) and pip for the backend.
*   Access to a **MongoDB** instance (local or cloud-hosted).
*   **API Keys** for:
    *   Google Generative AI (from Google AI Studio)
    *   Serper API (from serper.dev)

## 6. Environment Variables

An example environment file is included at `backend/.env.example`.  Copy this
file to `backend/.env` and replace the placeholder values with your own
configuration:

```
FLASK_SECRET_KEY=your_flask_secret_key
MONGO_URI=mongodb://localhost:27017/plagiarism_detector
GOOGLE_API_KEY=your_google_api_key
SERPER_API_KEY=your_serper_api_key
DEBUG=True
```

`FLASK_SECRET_KEY` should be a random string, `MONGO_URI` points to your MongoDB
instance and the API keys are obtained from Google AI Studio and serper.dev.
Set `DEBUG=False` in production.

**Note for Frontend:** The frontend makes API calls to the backend, typically at `http://127.0.0.1:5000`. This is hardcoded in the React hooks (`frontend/src/hooks/`). If your backend runs on a different URL, you'll need to update these hooks.

## 7. Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

3.  **Create a Python virtual environment:**
    ```bash
    python -m venv venv
    ```

4.  **Activate the virtual environment:**
    *   Windows:
        ```bash
        venv\Scripts\activate
        ```
    *   macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

5.  **Install dependencies:**
    ```bash
    pip install -r venv/requirements.txt
    ```
    *(The `requirements.txt` file lists all backend dependencies.)*

6.  **NLTK Data Download (if needed):**
    The application uses NLTK for text processing. The `core_detector.py` script attempts to download the 'stopwords' corpus if not found. You might need to ensure 'punkt' (for tokenization) is also available if not already handled by other dependencies or if explicit sentence tokenization is used elsewhere. If you encounter NLTK-related errors, you can manually download them by running a Python interpreter:
    ```python
    import nltk
    nltk.download('stopwords')
    nltk.download('punkt')
    ```

7.  **Create and populate the `.env` file:**
    As described in the "Environment Variables" section, create a `.env` file in the `backend` directory with your API keys and configurations.

8.  **Run the Flask development server:**
    ```bash
    python app.py
    ```

9.  The backend should now be running on `http://127.0.0.1:5000`.

## 8. Frontend Setup

1.  **Navigate to the frontend directory** (from the project root):
    ```bash
    cd frontend
    ```
    (If you are in the `backend` directory, use `cd ../frontend`)

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    (or `yarn install` if you prefer yarn)

3.  **Run the Vite development server:**
    ```bash
    npm run dev
    ```
    (or `yarn dev`)

4.  The frontend application should now be running, typically on `http://127.0.0.1:5173`, and will attempt to connect to the backend API at `http://127.0.0.1:5000`.

## 9. API Endpoints (Key Examples)

The backend exposes several API endpoints, including:

*   `POST /api/auth/register`: User registration.
*   `POST /api/auth/login`: User login.
*   `POST /api/auth/logout`: User logout.
*   `GET /@me`: Get details of the currently authenticated user.
*   `POST /analyse`: Submit text or a file for plagiarism and AI content analysis. Requires authentication.
*   `GET /api/history`: Retrieve the analysis history for the authenticated user. Requires authentication.
*   `GET /download-report/<filename>`: Download a specific PDF report. Requires authentication.
*   `GET /api/dashboard_stats`: Get user statistics for the dashboard. Requires authentication.

(Refer to `backend/app.py` for the complete list of routes and their functionalities.)

## 10. Contributing

Contributions are welcome! Please fork the repository, create a new branch for your feature or fix, and submit a pull request with your changes.

