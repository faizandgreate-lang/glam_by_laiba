-- ===== Glam by Laiba Database Schema =====

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('theme_name', 'theme1'),
('hero_title', 'Welcome, Laiba 💖'),
('hero_desc', 'Edit portfolio description from Admin.'),
('hero_bg', '/static/img/video-placeholder.png'),
('whatsapp_link', 'https://wa.me/0000000000'),
('profile_pdf', '');

-- GALLERY TABLE
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    position INTEGER DEFAULT 0
);

-- SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    media TEXT,
    position INTEGER DEFAULT 0
);

-- CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- UPLOADS TABLE
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    type TEXT,
    category TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
