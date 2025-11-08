import sqlite3
import os

# Ensure instance folder exists
if not os.path.exists("instance"):
    os.makedirs("instance")

# Database path
DB_PATH = "instance/data.db"

# Connect (will create file if not exists)
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# ---- Create tables ----

# 1. Settings table
c.execute("""
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)
""")

# 2. Portfolio items
c.execute("""
CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    filename TEXT,
    type TEXT, -- 'photo' or 'video'
    title TEXT,
    description TEXT,
    position INTEGER
)
""")

# 3. Services
c.execute("""
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    video TEXT,
    position INTEGER
)
""")

# 4. Users / admin
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
""")

# Add default admin (password: 1234)
c.execute("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ("admin", "1234"))

# Commit and close
conn.commit()
conn.close()

print("Database initialized successfully at", DB_PATH)
