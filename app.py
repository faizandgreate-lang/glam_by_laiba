# app.py
import os
import sqlite3
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

DB_PATH = os.path.join('instance', 'data.db')
STUDIO_PASSWORD = "1234"  # Change your Studio password here

# -------------------------
# Database helper
# -------------------------
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------
# Routes - Pages
# -------------------------
@app.route('/')
def index():
    return render_template('index.html')  # updated path

@app.route('/academy')
def academy():
    return render_template('academy.html')  # updated path

@app.route('/layout')
def layout():
    return render_template('layout.html')  # updated path

@app.route('/page')
def page():
    return render_template('page.html')  # updated path

# Catch-all for other pages to avoid 404
@app.route('/<page>')
def page_view(page):
    try:
        return render_template(f'{page}.html')  # updated path
    except:
        return redirect(url_for('index'))

# -------------------------
# Routes - Studio Mode APIs
# -------------------------

# Get settings
@app.route('/api/get_settings')
def get_settings():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM settings").fetchall()
    conn.close()
    data = {row['key']: row['value'] for row in rows}
    return jsonify(data)

# Save settings
@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.get_json()
    conn = get_db_connection()
    for k, v in data.items():
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# Login for Studio Mode
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if data.get('password') == STUDIO_PASSWORD:
        return jsonify({"ok": True})
    return jsonify({"ok": False})

# Upload media (image/video/PDF)
@app.route('/api/upload', methods=['POST'])
def upload():
    file = request.files.get('file')
    category = request.form.get('category', 'Studio')
    ftype = request.form.get('ftype', 'photo')
    if not file:
        return jsonify({"ok": False, "error": "No file uploaded"})

    filename = file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    conn = get_db_connection()
    conn.execute(
        "INSERT INTO uploads (filename, type, category) VALUES (?, ?, ?)",
        (filename, ftype, category)
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "filename": filename})

# Reorder gallery
@app.route('/api/reorder', methods=['POST'])
def reorder():
    data = request.get_json()
    order = data.get('order', [])
    conn = get_db_connection()
    for idx, gallery_id in enumerate(order):
        conn.execute("UPDATE gallery SET sort_order = ? WHERE id = ?", (idx, gallery_id))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# Serve uploads
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# -------------------------
# Run app
# -------------------------
if __name__ == '__main__':
    # Use host=0.0.0.0 for Render, port=PORT environment variable
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
