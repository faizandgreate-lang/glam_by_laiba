# init_db.py
import sqlite3
import os

DB_PATH = os.path.join("instance", "data.db")

# Ensure instance folder exists
if not os.path.exists("instance"):
    os.makedirs("instance")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# -------------------------
# Create tables
# -------------------------

# Settings table for theme, hero, profile PDF, WhatsApp link, etc.
c.execute("""
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)
""")

# Gallery table for portfolio images/videos
c.execute("""
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    type TEXT DEFAULT 'photo',
    sort_order INTEGER DEFAULT 0
)
""")

# Services table
c.execute("""
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0
)
""")

# Contacts table
c.execute("""
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    value TEXT
)
""")

# Uploads table for Studio Mode
c.execute("""
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    type TEXT,
    category TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

# -------------------------
# Insert default settings
# -------------------------
defaults = {
    "theme_name": "theme1",
    "hero_bg": "video-placeholder.png",
    "hero_title": "Welcome, Laiba 💖",
    "hero_desc": "Edit portfolio description from Admin.",
    "profile_pdf": "",
    "whatsapp_link": "https://wa.me/1234567890"
}

for k, v in defaults.items():
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

conn.commit()
conn.close()

print("Database initialized successfully at", DB_PATH)

