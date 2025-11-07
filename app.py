from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3, os, json
from werkzeug.utils import secure_filename
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / 'static' / 'uploads'
INSTANCE_DIR = BASE_DIR / 'instance'
DB_PATH = INSTANCE_DIR / 'data.db'
ALLOWED_IM_EXT = {'png', 'jpg', 'jpeg', 'webp', 'mp4', 'mov', 'ogg', 'webm'}
ADMIN_PASSWORD = '1234'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INSTANCE_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db_if_missing():
    conn = get_db()
    cur = conn.cursor()
    # settings
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    # photos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            type TEXT,
            category TEXT DEFAULT 'General',
            position INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # prices stored as JSON (editable)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY CHECK (id=1),
            data TEXT
        )
    """)
    # reviews
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            text TEXT,
            image TEXT,
            posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # defaults
    cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('site_title', 'Glam by Laiba')")
    cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('tagline', 'Makeup • Hair • Academy')")
    cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('bg_color', '#fff0f6')")  # soft pink default
    # default prices if missing
    cur.execute("SELECT data FROM prices WHERE id=1")
    if not cur.fetchone():
        default_prices = {
            "Party": {"Basic": "1500", "Advance": "2000", "HD": "3000"},
            "Engagement": {"Basic": "4000", "Advance": "6000", "HD Advance": "8000"},
            "Bridal": {"Basic": "6000", "HD": "10000", "Pakistani": "12000"}
        }
        cur.execute("INSERT INTO prices (id, data) VALUES (1, ?)", (json.dumps(default_prices),))
    conn.commit()
    conn.close()

init_db_if_missing()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 300 * 1024 * 1024  # 300MB safety


# --- Public pages (gallery top on all pages) ---
@app.route('/')
def home():
    conn = get_db()
    site_title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()['value']
    tagline = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()['value']
    bg_color = conn.execute("SELECT value FROM settings WHERE key='bg_color'").fetchone()['value']
    gallery = conn.execute("SELECT * FROM photos ORDER BY position ASC, uploaded_at DESC").fetchall()
    prices_row = conn.execute("SELECT data FROM prices WHERE id=1").fetchone()
    prices = json.loads(prices_row['data']) if prices_row else {}
    reviews = conn.execute("SELECT * FROM reviews ORDER BY posted_at DESC").fetchall()
    conn.close()
    return render_template('page.html',
                           site_title=site_title, tagline=tagline, bg_color=bg_color,
                           gallery=gallery, prices=prices, reviews=reviews, page='home')

@app.route('/portfolio')
def portfolio():
    conn = get_db()
    site_title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()['value']
    tagline = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()['value']
    bg_color = conn.execute("SELECT value FROM settings WHERE key='bg_color'").fetchone()['value']
    gallery = conn.execute("SELECT * FROM photos ORDER BY position ASC, uploaded_at DESC").fetchall()
    conn.close()
    return render_template('page.html',
                           site_title=site_title, tagline=tagline, bg_color=bg_color,
                           gallery=gallery, page='portfolio')

@app.route('/prices')
def prices():
    conn = get_db()
    site_title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()['value']
    tagline = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()['value']
    bg_color = conn.execute("SELECT value FROM settings WHERE key='bg_color'").fetchone()['value']
    gallery = conn.execute("SELECT * FROM photos ORDER BY position ASC, uploaded_at DESC").fetchall()
    prices_row = conn.execute("SELECT data FROM prices WHERE id=1").fetchone()
    prices = json.loads(prices_row['data']) if prices_row else {}
    reviews = conn.execute("SELECT * FROM reviews ORDER BY posted_at DESC").fetchall()
    conn.close()
    return render_template('page.html',
                           site_title=site_title, tagline=tagline, bg_color=bg_color,
                           gallery=gallery, prices=prices, reviews=reviews, page='prices')

@app.route('/contact')
def contact():
    conn = get_db()
    site_title = conn.execute("SELECT value FROM settings WHERE key='site_title'").fetchone()['value']
    tagline = conn.execute("SELECT value FROM settings WHERE key='tagline'").fetchone()['value']
    bg_color = conn.execute("SELECT value FROM settings WHERE key='bg_color'").fetchone()['value']
    gallery = conn.execute("SELECT * FROM photos ORDER BY position ASC, uploaded_at DESC").fetchall()
    conn.close()
    return render_template('page.html',
                           site_title=site_title, tagline=tagline, bg_color=bg_color,
                           gallery=gallery, page='contact')


# --- Admin API ---
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    return jsonify({'ok': data.get('password','') == ADMIN_PASSWORD})

@app.route('/api/settings', methods=['POST'])
def api_settings():
    data = request.get_json() or {}
    keys = ['site_title', 'tagline', 'bg_color']
    conn = get_db()
    for k in keys:
        if k in data:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, data[k]))
    conn.commit(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/get_settings')
def api_get_settings():
    conn = get_db()
    s = {}
    for key in ('site_title','tagline','bg_color'):
        row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        s[key]= row['value'] if row else ''
    prices_row = conn.execute("SELECT data FROM prices WHERE id=1").fetchone()
    s['prices'] = json.loads(prices_row['data']) if prices_row else {}
    gallery = conn.execute("SELECT id, filename, type, category FROM photos ORDER BY position ASC, uploaded_at DESC").fetchall()
    s['gallery'] = [dict(id=r['id'], filename=r['filename'], type=r['type'], category=r['category']) for r in gallery]
    conn.close()
    return jsonify(s)


@app.route('/api/reorder', methods=['POST'])
def api_reorder():
    data = request.get_json() or {}
    order = data.get('order', [])
    if not isinstance(order, list):
        return jsonify({'ok': False, 'error': 'invalid order'}), 400
    conn = get_db()
    for pos, pid in enumerate(order):
        conn.execute("UPDATE photos SET position=? WHERE id=?", (pos, pid))
    conn.commit(); conn.close()
    return jsonify({'ok': True})


@app.route('/api/prices', methods=['POST'])
def api_update_prices():
    data = request.get_json() or {}
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO prices (id, data) VALUES (1, ?)", (json.dumps(data),))
    conn.commit(); conn.close()
    return jsonify({'ok': True})


# --- Reviews ---
@app.route('/api/review', methods=['POST'])
def api_add_review():
    data = request.form or {}
    name = data.get('name','Anonymous')
    text = data.get('text','')
    image = None
    if 'image' in request.files:
        f = request.files['image']
        if f and f.filename:
            filename = secure_filename(f.filename)
            save_path = Path(app.config['UPLOAD_FOLDER']) / filename
            base, dot, extpart = filename.rpartition('.')
            counter = 1
            while save_path.exists():
                filename = f"{base}_{counter}.{extpart}"
                save_path = Path(app.config['UPLOAD_FOLDER']) / filename
                counter += 1
            f.save(str(save_path))
            image = filename
    conn = get_db()
    conn.execute("INSERT INTO reviews (name, text, image) VALUES (?, ?, ?)", (name, text, image))
    conn.commit(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/review/<int:rid>', methods=['DELETE'])
def api_delete_review(rid):
    conn = get_db()
    row = conn.execute("SELECT image FROM reviews WHERE id=?", (rid,)).fetchone()
    if row and row['image']:
        p = Path(app.config['UPLOAD_FOLDER']) / row['image']
        p.unlink(missing_ok=True)
    conn.execute("DELETE FROM reviews WHERE id=?", (rid,))
    conn.commit(); conn.close()
    return jsonify({'ok': True})


# --- Gallery upload/delete ---
@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'error': 'No file part'})
    f = request.files['file']
    if f.filename == '':
        return jsonify({'ok': False, 'error': 'No selected file'})
    category = request.form.get('category','General')
    ftype = request.form.get('ftype','photo')
    filename = secure_filename(f.filename)
    ext = filename.rsplit('.',1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_IM_EXT:
        return jsonify({'ok': False, 'error': 'Invalid file type'})
    save_path = Path(app.config['UPLOAD_FOLDER']) / filename
    base, dot, extpart = filename.rpartition('.')
    counter = 1
    while save_path.exists():
        filename = f"{base}_{counter}.{extpart}"
        save_path = Path(app.config['UPLOAD_FOLDER']) / filename
        counter += 1
    f.save(str(save_path))
    conn = get_db()
    cur = conn.execute("INSERT INTO photos (filename, type, category) VALUES (?, ?, ?)", (filename, ftype, category))
    conn.commit(); pid = cur.lastrowid; conn.close()
    return jsonify({'ok': True, 'id': pid, 'filename': filename})

@app.route('/api/photo/<int:pid>', methods=['DELETE'])
def api_delete_photo(pid):
    conn = get_db()
    row = conn.execute("SELECT filename FROM photos WHERE id=?", (pid,)).fetchone()
    if not row:
        conn.close(); return jsonify({'ok': False, 'error': 'Not found'})
    fn = row['filename']
    conn.execute("DELETE FROM photos WHERE id=?", (pid,))
    conn.commit(); conn.close()
    p = Path(app.config['UPLOAD_FOLDER']) / fn
    p.unlink(missing_ok=True)
    return jsonify({'ok': True})

# serve uploads
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ----------------------
# Generic content saver
# ----------------------
@app.route('/api/save_content', methods=['POST'])
def api_save_content():
    """
    Save arbitrary key/value pairs into settings table.
    Expects JSON: {"key": "...", "value": "..."} OR multiple keys: {"k1":"v1", "k2":"v2"}
    """
    try:
        data = request.get_json() or {}
        if not data:
            return jsonify({'ok': False, 'error': 'no data'}), 400
        conn = get_db()
        # allow either single (key,value) or multiple keys
        if 'key' in data and 'value' in data and len(data)==2:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (data['key'], data['value']))
        else:
            for k, v in data.items():
                # convert non-string to JSON string if needed
                if isinstance(v, (dict, list)):
                    v = json.dumps(v)
                conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        # simple logging
        try:
            with open(INSTANCE_DIR / 'error_save_content.log', 'a', encoding='utf-8') as f:
                f.write(str(e) + '\n')
        except:
            pass
        return jsonify({'ok': False, 'error': 'save failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
