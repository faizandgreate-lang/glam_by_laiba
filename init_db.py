import sqlite3

# Database file
DB_FILE = 'instance/data.db'

# Schema file
SCHEMA_FILE = 'schema.sql'

def init_db():
    # Connect to DB (creates if not exists)
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Read schema.sql
    with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Execute script
    c.executescript(sql_script)
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()
