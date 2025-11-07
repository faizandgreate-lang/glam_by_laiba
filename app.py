from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
import sqlite3, os
from werkzeug.utils import secure_filename
from pathlib import Path
def init_db_if_missing():
    conn = sqlite3.connect("instance/data.db")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            type TEXT
        )
    """)
    conn.commit()
    conn.close()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / 'static' / 'uploads'
DB_PATH = BASE_DIR / 'instance' / 'data.db'
ALLOWED_IM_EXT = {'png','jpg','jpeg','webp','mp4','mov','ogg','webm'}
ADMIN_PASSWORD = '1234'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DB_PATH.parent, exist_ok=True)

app = Flask(__name__)
init_db_if_missing()

app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB total safety per upload

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not DB_PATH.exists():
        with open(BASE_DIR / 'schema.sql','r') as f:
            sql = f.read()
        conn = get_db()
        conn.executescript(sql)
        conn.commit()
        conn.close()

init_db()

@app.route('/')
def index():
    conn = get_db()
    cur = conn.execute("SELECT value FROM settings WHERE key='site_title'")
    row = cur.fetchone()
    title = row['value'] if row else 'Glam by Laiba'
    tagline_row = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()
    tagline = tagline_row['value'] if tagline_row else ''
    items = conn.execute('SELECT * FROM photos ORDER BY uploaded_at DESC').fetchall()
    conn.close()
    items_list = [dict(id=r['id'], filename=r['filename'], type=r['type'], category=r['category']) for r in items]
    return render_template('index.html', site_title=title, tagline=tagline, items=items_list)

@app.route('/academy')
def academy():
    conn = get_db()
    cur = conn.execute("SELECT value FROM settings WHERE key='site_title'")
    row = cur.fetchone()
    title = row['value'] if row else 'Glam by Laiba Academy'
    conn.close()
    return render_template('academy.html', site_title=title)

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    pwd = data.get('password','')
    return jsonify({'ok': pwd == ADMIN_PASSWORD})

@app.route('/api/update_title', methods=['POST'])
def api_update_title():
    data = request.get_json() or {}
    new_title = data.get('title','').strip()
    new_tagline = data.get('tagline','').strip()
    if not new_title:
        return jsonify({'ok': False, 'error': 'Empty title'})
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings(key, value) VALUES ('site_title',?)", (new_title,))
    conn.execute("INSERT OR REPLACE INTO settings(key, value) VALUES ('tagline',?)", (new_tagline,))
    conn.commit(); conn.close()
    return jsonify({'ok': True, 'title': new_title, 'tagline': new_tagline})

@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'error': 'No file part'})
    f = request.files['file']
    category = request.form.get('category','General')
    ftype = request.form.get('ftype','photo')  # 'photo' or 'video'
    if f.filename == '':
        return jsonify({'ok': False, 'error': 'No selected file'})
    filename = secure_filename(f.filename)
    ext = filename.rsplit('.',1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_IM_EXT:
        return jsonify({'ok': False, 'error': 'Invalid file type'})
    save_path = Path(app.config['UPLOAD_FOLDER']) / filename
    # unique filename
    base, dot, extpart = filename.rpartition('.')
    counter = 1
    while save_path.exists():
        filename = f"{base}_{counter}.{extpart}"
        save_path = Path(app.config['UPLOAD_FOLDER']) / filename
        counter += 1
    f.save(str(save_path))
    conn = get_db()
    cur = conn.execute('INSERT INTO photos(filename, type, category) VALUES (?,?,?)', (filename, ftype, category))
    conn.commit()
    photo_id = cur.lastrowid
    conn.close()
    return jsonify({'ok': True, 'id': photo_id, 'filename': filename})

@app.route('/api/delete/<int:item_id>', methods=['POST'])
def api_delete(item_id):
    conn = get_db()
    row = conn.execute('SELECT filename FROM photos WHERE id=?', (item_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'ok': False, 'error': 'Item not found'})
    filename = row['filename']
    conn.execute('DELETE FROM photos WHERE id=?', (item_id,))
    conn.commit(); conn.close()
    try:
        p = Path(app.config['UPLOAD_FOLDER']) / filename
        if p.exists(): p.unlink()
    except Exception:
        pass
    return jsonify({'ok': True})

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
