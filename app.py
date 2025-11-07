from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3, os
from werkzeug.utils import secure_filename
from pathlib import Path

# --- BASIC PATHS ---
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / 'static' / 'uploads'
INSTANCE_DIR = BASE_DIR / 'instance'
DB_PATH = INSTANCE_DIR / 'data.db'
ALLOWED_IM_EXT = {'png', 'jpg', 'jpeg', 'webp', 'mp4', 'mov', 'ogg', 'webm'}
ADMIN_PASSWORD = '1234'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INSTANCE_DIR, exist_ok=True)


# --- AUTO CREATE DATABASE IF MISSING ---
def init_db_if_missing():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Settings table (site title, tagline)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # Photos table for gallery uploads
    cur.execute("""
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            type TEXT,
            category TEXT DEFAULT 'General',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Default values
    cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('site_title', 'Glam by Laiba')")
    cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('tagline', 'Makeup • Hair • Academy')")
    conn.commit()
    conn.close()


# --- FLASK APP SETUP ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB per upload
init_db_if_missing()


# --- DB CONNECT ---
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


# --- ROUTES ---

@app.route('/')
def index():
    conn = get_db()
    title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()
    tagline = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()
    items = conn.execute("SELECT * FROM photos ORDER BY uploaded_at DESC").fetchall()
    conn.close()

    title_val = title['value'] if title else 'Glam by Laiba'
    tagline_val = tagline['value'] if tagline else ''

    return render_template('index.html', site_title=title_val, tagline=tagline_val, items=items)


@app.route('/academy')
def academy():
    conn = get_db()
    title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()
    conn.close()
    return render_template('academy.html', site_title=title['value'] if title else 'Glam by Laiba Academy')


# --- API: ADMIN LOGIN ---
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    pwd = data.get('password', '')
    return jsonify({'ok': pwd == ADMIN_PASSWORD})


# --- API: UPDATE TITLE ---
@app.route('/api/update_title', methods=['POST'])
def api_update_title():
    data = request.get_json() or {}
    new_title = data.get('title', '').strip()
    new_tagline = data.get('tagline', '').strip()

    if not new_title:
        return jsonify({'ok': False, 'error': 'Empty title'})

    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings(key, value) VALUES ('site_title', ?)", (new_title,))
    conn.execute("INSERT OR REPLACE INTO settings(key, value) VALUES ('tagline', ?)", (new_tagline,))
    conn.commit()
    conn.close()

    return jsonify({'ok': True, 'title': new_title, 'tagline': new_tagline})


# --- API: UPLOAD ---
@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'error': 'No file part'})

    f = request.files['file']
    if f.filename == '':
        return jsonify({'ok': False, 'error': 'No selected file'})

    category = request.form.get('category', 'General')
    ftype = request.form.get('ftype', 'photo')
    filename = secure_filename(f.filename)
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

    if ext not in ALLOWED_IM_EXT:
        return jsonify({'ok': False, 'error': 'Invalid file type'})

    # Unique filename logic
    save_path = Path(app.config['UPLOAD_FOLDER']) / filename
    base, dot, extpart = filename.rpartition('.')
    counter = 1
    while save_path.exists():
        filename = f"{base}_{counter}.{extpart}"
        save_path = Path(app.config['UPLOAD_FOLDER']) / filename
        counter += 1

    f.save(str(save_path))

    conn = get_db()
    cur = conn.execute("INSERT INTO photos(filename, type, category) VALUES (?, ?, ?)",
                       (filename, ftype, category))
    conn.commit()
    photo_id = cur.lastrowid
    conn.close()

    return jsonify({'ok': True, 'id': photo_id, 'filename': filename})


# --- API: DELETE FILE ---
@app.route('/api/delete/<int:item_id>', methods=['POST'])
def api_delete(item_id):
    conn = get_db()
    row = conn.execute('SELECT filename FROM photos WHERE id=?', (item_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'ok': False, 'error': 'Item not found'})

    filename = row['filename']
    conn.execute('DELETE FROM photos WHERE id=?', (item_id,))
    conn.commit()
    conn.close()

    file_path = Path(app.config['UPLOAD_FOLDER']) / filename
    if file_path.exists():
        file_path.unlink(missing_ok=True)

    return jsonify({'ok': True})


# --- FILE SERVE ---
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# --- MAIN RUN ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
