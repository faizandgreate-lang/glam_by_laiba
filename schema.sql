-- ---------------------------------------------------
-- Schema for Glam by Laiba Website
-- ---------------------------------------------------

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    value TEXT
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key_name, value) VALUES 
('theme_name', 'theme1'),
('hero_title', 'Welcome, Laiba 💖'),
('hero_desc', 'Edit portfolio description from Admin.'),
('hero_bg', 'video-placeholder.png'),
('profile_pdf', ''),
('whatsapp_link', 'https://wa.me/0000000000');

-- GALLERY CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Default categories
INSERT OR IGNORE INTO categories (name) VALUES 
('Bridal'), ('Party'), ('Other');

-- GALLERY TABLE
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    filename TEXT,
    type TEXT CHECK(type IN ('photo','video')) DEFAULT 'photo',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    media_filename TEXT,
    media_type TEXT CHECK(media_type IN ('photo','video')) DEFAULT 'photo',
    sort_order INTEGER DEFAULT 0
);

-- CONTACT / ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- UPLOADS TABLE (for media & PDFs)
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    type TEXT CHECK(type IN ('photo','video','pdf')),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: USER / ADMIN table for Studio Mode login
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
);

-- Insert default admin (password: 1234)
INSERT OR IGNORE INTO users (username, password) VALUES ('admin', '1234');

-- INDEXES for faster lookups
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category_id);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);
