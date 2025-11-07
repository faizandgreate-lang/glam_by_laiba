import sqlite3

conn = sqlite3.connect('instance/data.db')
c = conn.cursor()

# Create the settings table
c.execute('''
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
)
''')

# Create the gallery table
c.execute('''
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    type TEXT,
    title TEXT
)
''')

# Insert default settings
c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('site_title', 'Glam by Laiba')")
c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('site_subtitle', 'Illuminate Your Natural Glow')")

conn.commit()
conn.close()

print("✅ Database initialized successfully!")
