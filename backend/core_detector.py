# backend/core_detector.py
"""
This file contains the core plagiarism detection logic.
It is intended to be imported as a module by a web server (e.g., Flask).
"""

# NO LONGER INCLUDES NUMPY VERSION CHECK/DOWNGRADE LOGIC.
# This was causing compilation issues and is best handled by requirements.txt.

import os
import re
import io
import tempfile
import requests
import textwrap
import time
import google.generativeai as genai
import nltk
from collections import Counter, defaultdict
from typing import List, Dict, Tuple, Any, Optional
from slugify import slugify
import pandas as pd
from tabulate import tabulate
from dotenv import load_dotenv; load_dotenv()

# Removed imports for visualization: matplotlib, seaborn, sklearn
# Removed imports for Gradio: gradio
# Removed imports for v4p: openai, mimetypes, datetime, inch, letter, ParagraphStyle, rapidfuzz_process

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

DEBUG = os.getenv("DEBUG", "").lower() in ("1", "true")

# Load NLTK stopwords
user_specific_stopwords = ["data", "learning", "prediction", "machine", "link", "model", "using", "based"]
try:
    from nltk.corpus import stopwords
    STOPWORDS = set(stopwords.words('english'))
    STOPWORDS.update(user_specific_stopwords)
except ImportError:
    if DEBUG: print("NLTK library not found. Please ensure it's installed. Falling back to a basic stopword list.")
    STOPWORDS = set(["a", "an", "the", "is", "in", "it", "of", "on", "and", "to", "with",'i', 'me', 'my', 'myself', 'we', 'our', 'ours','ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself','yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself','it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves','what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are','was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing','a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for','with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to','from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once','here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most','other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very','s', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't",'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"] + user_specific_stopwords)

except LookupError:
    if DEBUG: print("NLTK stopwords resource not found. Attempting to download...")
    try:
        nltk.download('stopwords', quiet=True)
        from nltk.corpus import stopwords
        STOPWORDS = set(stopwords.words('english'))
        STOPWORDS.update(user_specific_stopwords)
    except Exception as e:
        if DEBUG: print(f"Failed to download NLTK stopwords: {e}. Falling back to a basic stopword list.")
        STOPWORDS = set(["a", "an", "the", "is", "in", "it", "of", "on", "and", "to", "with",'i', 'me', 'my', 'myself', 'we', 'our', 'ours','ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself','yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself','it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves','what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are','was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing','a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for','with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to','from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once','here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most','other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very','s', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't",'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"] + user_specific_stopwords)

# PDF and Docx imports:
from pdfminer.high_level import extract_text as pdf2text
from docx import Document
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                PageBreak,TableStyle)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import numpy as np
from bs4 import BeautifulSoup
from rapidfuzz import fuzz

# ─────────── tuning knobs ───────────
MAX_QUERIES   = 12
MAX_PAGES     = 40
WINDOW_SENT   = 3
TH_FUZZ       = 55
TH_COS        = 0.40
MAX_OVERL_URL = 6
# ────────────────────────────────────

styles = getSampleStyleSheet()
S, H3, H2 = styles["Normal"], styles["Heading3"], styles["Heading2"]

# ─────────── file → text ───────────
def extract_text_file(path: str) -> str:
    lower = path.lower()
    if lower.endswith(".pdf"):
        return pdf2text(path)
    if lower.endswith((".docx", ".doc")):
        return " ".join(p.text for p in Document(path).paragraphs)
    return open(path, "r", encoding="utf-8", errors="ignore").read()

# ─────────── stats & keywords ───────────
def doc_stats(txt: str) -> Dict[str, int]:
    words = re.findall(r"\w+", txt)
    sents = re.split(r"(?<=[.!?])\s+", txt)
    return {"words": len(words), "sentences": len(sents),
            "avg_sent_len": round(len(words)/max(1, len(sents)), 1)}

def top_keywords(txt: str, k: int = 20):
    tokens = [w.lower() for w in re.findall(r"[A-Za-z]{4,}", txt)]
    return Counter(tokens).most_common(k)

# ─────────── embeddings cache ───────────
_vec: Dict[str, List[float]] = {}
def embed(t: str) -> List[float]:
    if t in _vec:
        return _vec[t]
    time.sleep(1) # Added to avoid hitting rate limits
    result = genai.embed_content(model="models/embedding-001", content=t)
    v = result['embedding']
    _vec[t] = v
    return v
def cos(a, b):
    a, b = np.array(a), np.array(b)
    return float(a @ b / (np.linalg.norm(a)*np.linalg.norm(b)+1e-6))

# ─────────── Web search agent ───────────
def _serper_norm_hits(response_json: dict) -> List[Dict[str, str]]:
    """Parses Serper API JSON response into a standard format."""
    out = []
    if not response_json or 'organic' not in response_json:
        return out
    for item in response_json['organic']:
        out.append({
            "url": item.get('link'),
            "title": item.get('title'),
            "snippet": item.get('snippet')
        })
    return out

def _build_queries(txt):
    title = txt.splitlines()[0][:120]
    gemini_queries = []

    abstract_match = re.search(
        r'^Abstract\s*?\n([\s\S]+?)(?=\n\n|\n[A-ZÀ-Ü][^a-zà-ü\s]+\s*:|\nI\.\s|\n1\.\s|$)',
        txt, re.IGNORECASE | re.MULTILINE
    )
    text_sample = ""
    if abstract_match:
        text_sample = abstract_match.group(1).strip()
        if DEBUG: print(f"Found abstract for Gemini query generation: {len(text_sample)} chars")
    else:
        if DEBUG: print("No abstract found, using first ~400 words for Gemini query generation.")
        text_sample = " ".join(txt.split()[:400])
    
    text_sample = text_sample[:2000]

    if GOOGLE_API_KEY and text_sample:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""Given the following text, please generate a list of 5 to 7 effective search query phrases that would be useful for finding similar documents or checking for prior work on the main topics discussed. Each query phrase should be on a new line. Avoid very generic terms if better, more specific phrases can be derived from the text.

Text:
---
{text_sample}
---

Search Query Phrases:"""
        try:
            time.sleep(1)
            response = model.generate_content(prompt)
            if response.text:
                gemini_queries = [q.strip() for q in response.text.split('\n') if q.strip() and len(q.strip()) > 3]
                if DEBUG: print(f"Gemini generated queries: {gemini_queries}")
        except Exception as e:
            if DEBUG: print(f"Error calling Gemini for query generation: {e}")
    
    if not gemini_queries:
        if DEBUG: print("Gemini query generation failed or returned no (valid) queries. Falling back to keyword-based queries.")
        kws = [w for w, _ in Counter(re.findall(r"[A-Za-z]{4,}", txt.lower())).most_common(30)]
        filtered_kws = [kw for kw in kws if kw not in STOPWORDS]
        gemini_queries = filtered_kws

    final_queries = [title]
    for q in gemini_queries:
        if q.lower() != title.lower() and q.lower() not in [fq.lower() for fq in final_queries]:
            final_queries.append(q)
            if len(final_queries) >= MAX_QUERIES:
                break 
    
    return final_queries[:MAX_QUERIES]

def _bs_fetch(u, limit=30_000):
    try:
        html = requests.get(u, timeout=8,
                            headers={"User-Agent": "Mozilla/5.0"}).text
        soup = BeautifulSoup(html, "html.parser")
        for t in soup(["script", "style", "noscript"]):
            t.decompose()
        return soup.get_text(" ", strip=True)[:limit]
    except Exception as e:
        if DEBUG: print(f"Error fetching URL {u}: {e}")
        return ""
def run_search(txt):
    queries = _build_queries(txt)
    hits = {}

    if not SERPER_API_KEY:
        if DEBUG:
            print("Warning: SERPER_API_KEY not set. Skipping web search.")
        return [], queries

    headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}

    for q_idx, q in enumerate(queries):
        if DEBUG: print(f"Searching query {q_idx+1}/{len(queries)} (Serper): {q}")
        payload_dict = {"q": q, "num": 10}

        try:
            if q_idx > 0: time.sleep(0.5)

            response = requests.post("https://google.serper.dev/search", headers=headers, json=payload_dict, timeout=10)
            response.raise_for_status()
            search_results_json = response.json()
            
            parsed_hits = _serper_norm_hits(search_results_json)
            for h in parsed_hits:
                if len(hits) >= MAX_PAGES:
                    break
                if h["url"] and h["url"] not in hits:
                    time.sleep(0.2)
                    h["text"] = _bs_fetch(h["url"])
                    if h["text"]:
                        hits[h["url"]] = h
            
            if len(hits) >= MAX_PAGES:
                if DEBUG: print(f"Reached MAX_PAGES ({MAX_PAGES}). Stopping search.")
                break
        except requests.exceptions.RequestException as e:
            if DEBUG: print(f"Error calling Serper API for query '{q}': {e}")
            continue 
        except Exception as e: 
            if DEBUG: print(f"Generic error processing query '{q}' with Serper: {e}")
            continue

    return list(hits.values()), queries

# ─────────── AI probability ───────────
def detect_ai(txt):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = (
        "Analyze the following text and estimate the probability that it was AI-generated. "
        "Return your answer as '<percentage>% – <brief reason>'. "
        "For example: '85% – The text exhibits repetitive sentence structures and a lack of personal anecdotes.'\n\n"
        "Text:\n" + txt[:4096]
    )
    try:
        time.sleep(1)
        response = model.generate_content(prompt)
        line = response.text.split("\n")[0]
    except Exception as e:
        if DEBUG: print(f"Gemini API call failed: {e}")
        return 50.0, "Error calling Gemini API."

    m = re.search(r"(\d{1,3})", line)
    probability = float(m.group(1)) if m else 50.0
    reason = line.split("–", 1)[-1].strip() if "–" in line else "Could not parse reason."
    
    return probability, reason

# ─────────── plagiarism detection ───────────
def sents(t):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", t) if s.strip()]
def plagiarism(doc, pages):
    doc_chunks = [" ".join(sents(doc)[i:i+WINDOW_SENT])
                  for i in range(len(sents(doc))-WINDOW_SENT)]
    doc_vec = [embed(c[:500]) for c in doc_chunks]
    overlaps, word_overlap, per_url = [], 0, defaultdict(int)
    for pg in pages:
        if not pg["text"]:
            continue
        pg_chunks = [" ".join(sents(pg["text"])[i:i+WINDOW_SENT])
                     for i in range(len(sents(pg["text"]))-WINDOW_SENT)]
        for ch in pg_chunks:
            if per_url[pg["url"]] >= MAX_OVERL_URL:
                break
            fuzz_sc = fuzz.token_set_ratio(ch, doc)
            if fuzz_sc < TH_FUZZ:
                continue
            v = embed(ch[:500])
            cos_sc = max(cos(v, dv) for dv in doc_vec) if doc_vec else 0
            if cos_sc < TH_COS:
                continue
            overlaps.append((ch[:180]+"…", fuzz_sc, round(cos_sc, 2), pg["url"]))
            word_overlap += len(ch.split())
            per_url[pg["url"]] += 1
    orig = max(0, 100 - word_overlap/max(1, len(doc.split()))*100)
    return orig, sorted(overlaps, key=lambda x: (-x[1], -x[2]))

# ─────────── PDF builder (Standard, no visualization) ───────────
def pdf_report(doc_text, orig, ai, reason, queries, hits, cites):
    stats = doc_stats(doc_text)
    story = [
        Paragraph("Executive Summary", H2),
        Paragraph(f"Word count: {stats['words']}, "
                  f"Sentences: {stats['sentences']}, "
                  f"Avg sentence length: {stats['avg_sent_len']} words.", S),
        Paragraph(f"Originality score: <b>{orig:.1f}%</b>", S),
        Paragraph(f"AI probability: <b>{ai:.1f}%</b> — {reason}", S),
        Spacer(1, 12)
    ]

    story.append(Paragraph("Top Keywords", H3))
    
    kw_header_row = [Paragraph('<b>Keyword</b>', S), Paragraph('<b>Freq</b>', S)]
    kw_data_rows = []
    for k_word, freq_val in top_keywords(doc_text, 15):
        kw_data_rows.append([Paragraph(k_word, S), Paragraph(str(freq_val), S)])
    kw_table_data = [kw_header_row] + kw_data_rows
    
    kw_table_style = TableStyle([
        ("GRID",       (0, 0), (-1, -1), 0.25, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0),  colors.whitesmoke),
        ("ALIGN",      (1, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",(0, 0), (-1, -1), 4),
        ("RIGHTPADDING",(0, 0), (-1, -1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
    ])
    kw_table = Table(kw_table_data, colWidths=[200, 50], style=kw_table_style)
    story.extend([kw_table, Spacer(1, 12)])

    story += [Paragraph("Queries Generated", H3)]
    story.extend(Paragraph(q, S) for q in queries)
    story.append(Spacer(1, 12))

    if hits:
        story.append(Paragraph("Top Search Results", H3))
        
        search_results_header_row = [
            Paragraph('<b>Title</b>', S),
            Paragraph('<b>URL</b>', S),
            Paragraph('<b>Snippet</b>', S)
        ]
        search_results_data_rows = []
        for h_item in hits[:12]:
            title_text = h_item.get("title", "")
            url_text = h_item.get("url", "")
            snippet_text = (h_item.get("snippet", "")[:70] + "…") if h_item.get("snippet") else ""
            search_results_data_rows.append([
                Paragraph(title_text, S),
                Paragraph(url_text, S),
                Paragraph(snippet_text, S)
            ])
        
        search_results_table_data = [search_results_header_row] + search_results_data_rows
        
        search_results_table_style = TableStyle([
            ("GRID", (0,0), (-1,-1), 0.25, colors.grey),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 3),
            ("RIGHTPADDING", (0,0), (-1,-1), 3),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ])
        
        search_results_table = Table(search_results_table_data, colWidths=[140, 180, 200], style=search_results_table_style)
        story.append(search_results_table)
        story.append(Spacer(1, 12))

    if cites:
        story.append(Paragraph("Detected Overlaps", H3))
        for sn, fs, cs, u in cites:
            story += [Paragraph(f"[Fuzz {fs} / Cos {cs}] "
                                f"<i>{sn}</i><br/><a href='{u}'>{u}</a>", S),
                      Spacer(1, 6)]
    else:
        story.append(Paragraph("No overlaps detected above thresholds.", S))

    story += [
        PageBreak(),
        Paragraph("Methodology", H2),
        Paragraph(textwrap.dedent(f"""
            • Generated {len(queries)} keyword queries (title + TF-IDF terms).
            • Serper API retrieved {len(hits)} pages (max {MAX_PAGES}).
            • Each page scraped (BeautifulSoup) and token-cleaned.
            • Comparison window: {WINDOW_SENT} sentences.
            • Overlap when RapidFuzz ≥ {TH_FUZZ}% **or** cosine ≥ {TH_COS}.  
            • Originality = 100 − overlapped-word ratio.
            • AI Probability assessed using Google Gemini.
        """), S)
    ]

    buf = io.BytesIO()
    doc_template = SimpleDocTemplate(buf)
    doc_template.build(story)
    buf.seek(0)
    return buf.getvalue()

# ─────────── main analyse function for external use ───────────
def analyse(main_txt: Optional[str] = None, main_file: Optional[Dict[str, str]] = None,
            comparison_txt: Optional[str] = None, comparison_file: Optional[Dict[str, str]] = None) \
            -> Tuple[str, float, float, Optional[str]]:
    
    doc_text = ""
    if main_file:
        doc_text = extract_text_file(main_file['name'])
    elif main_txt:
        doc_text = main_txt
    
    doc_text = (doc_text or "").strip()
    if not doc_text:
        return "Provide text", 0, 0, None 
    
    # --- NOTE ON COMPARISON DOCUMENT FEATURE ---
    # The current core_detector.py plagiarism logic (the `plagiarism` function)
    # is designed to compare the main document against web search results.
    # It DOES NOT natively support direct document-to-document plagiarism comparison
    # (i.e., comparing `doc_text` against `comparison_txt`/`comparison_file`).
    #
    # To implement "comparison document" analysis, you would need to:
    # 1. Read `comparison_txt` or `comparison_file` into `comparison_doc_text`.
    # 2. Develop a new function (e.g., `compare_documents(doc_text, comparison_doc_text)`)
    #    that implements algorithms like cosine similarity, fuzzy matching, or other
    #    techniques specifically for comparing two local texts.
    # 3. Integrate the results of this new comparison into the overall report.
    #
    # For this iteration, these parameters are accepted but not yet used
    # in the core plagiarism/AI detection pipeline. They are merely passed through
    # for future expansion. The returned values (cite_txt, orig, ai, pdf_path)
    # still primarily reflect the web-based plagiarism and AI detection.
    # -------------------------------------------

    hits, queries = run_search(doc_text)
    orig, cites = plagiarism(doc_text, hits)
    ai, reason = detect_ai(doc_text)
    pdf = pdf_report(doc_text, orig, ai, reason, queries, hits, cites)
    
    pdf_path = None
    if pdf: # Ensure PDF content is generated before saving
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            pdf_path = tmp.name
    
    cite_txt = "\n".join(f"[F{fs}/C{cs}] {u}" for _, fs, cs, u in cites) or "No overlaps."
    return cite_txt, orig, ai, pdf_path