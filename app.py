from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os

app = Flask(__name__)
DB_PATH = "instance/data.db"
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------
# Helper: DB connection
# ---------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------
# API: Get all settings
# ---------------------
@app.route("/api/get_settings")
def get_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return jsonify({row["key"]: row["value"] for row in rows})

# ---------------------
# API: Update a setting
# ---------------------
@app.route("/api/settings", methods=["POST"])
def update_setting():
    data = request.json
    conn = get_db()
    for key, value in data.items():
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value)
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# ---------------------
# API: Upload media (photo/video/pdf)
# ---------------------
@app.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    category = request.form.get("category", "Studio")
    ftype = request.form.get("ftype", "photo")
    if not file:
        return jsonify({"ok": False})
    
    filename = file.filename
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    # Save record in uploads table
    conn = get_db()
    conn.execute(
        "INSERT INTO uploads (filename, filetype, category) VALUES (?, ?, ?)",
        (filename, ftype, category)
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "filename": filename})

# ---------------------
# API: Reorder gallery
# ---------------------
@app.route("/api/reorder", methods=["POST"])
def reorder_gallery():
    data = request.json
    order = data.get("order", [])
    conn = get_db()
    for pos, gid in enumerate(order, 1):
        conn.execute("UPDATE gallery SET position=? WHERE id=?", (pos, gid))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# ---------------------
# API: Studio login
# ---------------------
@app.route("/api/login", methods=["POST"])
def studio_login():
    data = request.json
    if data.get("password") == "1234":
        return jsonify({"ok": True})
    return jsonify({"ok": False})

# ---------------------
# Serve uploaded files
# ---------------------
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ---------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
