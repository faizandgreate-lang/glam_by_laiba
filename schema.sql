-- schema for photos and settings
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  type TEXT NOT NULL, -- 'photo' or 'video'
  category TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO settings(key, value) VALUES ('site_title', 'Glam by Laiba - Illuminate Your Natural Glow');
INSERT OR IGNORE INTO settings(key, value) VALUES ('tagline', 'Illuminate Your Natural Glow');
