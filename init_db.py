import sqlite3
import os

# Ensure instance folder exists
if not os.path.exists('instance'):
    os.makedirs('instance')

DB_PATH = 'instance/data.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # SETTINGS table: stores editable text, hero, theme, PDF, etc.
    c.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')

    # GALLERY table: images/videos
    c.execute('''
    CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        category TEXT DEFAULT 'Other',
        order_no INTEGER DEFAULT 0,
        type TEXT CHECK(type IN ('photo','video')) NOT NULL
    )
    ''')

    # SERVICES table
    c.execute('''
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT,
        video TEXT,
        order_no INTEGER DEFAULT 0
    )
    ''')

    # CONTACTS table
    c.execute('''
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        value TEXT
    )
    ''')

    # UPLOADS table
    c.execute('''
    CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        category TEXT,
        type TEXT CHECK(type IN ('photo','video','pdf')),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Insert default theme and hero if not exist
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('theme_name', 'theme1'))
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('hero_bg', '/static/img/video-placeholder.png'))
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('hero_title', 'Welcome, Laiba 💖'))
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('hero_desc', 'Edit portfolio description from Admin.'))
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('profile_pdf', ''))  # PDF for download
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('whatsapp_link', 'https://wa.me/0000000000'))

    conn.commit()
    conn.close()
    print("✅ Database initialized at", DB_PATH)

if __name__ == "__main__":
    init_db()
