import sqlite3
import os

DB_PATH = "instance/data.db"

# Ensure instance folder exists
os.makedirs("instance", exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1️⃣ Settings table (theme, hero, WhatsApp link, profile PDF)
c.execute("""
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)
""")

# Insert default settings if not exist
defaults = {
    "theme_name": "theme1",
    "hero_bg": "",
    "hero_title": "Welcome, Laiba 💖",
    "hero_desc": "Edit portfolio description from Admin.",
    "whatsapp_link": "https://wa.me/0000000000?text=Hi%20Laiba,%20I%20want%20to%20book%20an%20appointment",
    "profile_pdf": ""
}

for key, value in defaults.items():
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, value))

# 2️⃣ Gallery table
c.execute("""
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    filename TEXT,
    position INTEGER
)
""")

# 3️⃣ Services table
c.execute("""
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    position INTEGER
)
""")

# 4️⃣ Contacts table
c.execute("""
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    value TEXT
)
""")

# 5️⃣ Uploads table (photos/videos/pdf)
c.execute("""
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    filetype TEXT,
    category TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()
conn.close()
print("Database initialized successfully!")
