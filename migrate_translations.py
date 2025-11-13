"""
Migration script to add translations table to the database.
Run this script to update your existing database with the new translations feature.
"""

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.connect() as conn:
        # Check if translations table already exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='translations'"
        ))
        
        if result.fetchone():
            print("✓ Translations table already exists. No migration needed.")
            return
        
        # Create translations table
        conn.execute(text("""
            CREATE TABLE translations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                menu_item_id INTEGER NOT NULL,
                language_code VARCHAR(10) NOT NULL,
                language_name VARCHAR(50) NOT NULL,
                name VARCHAR NOT NULL,
                description TEXT,
                is_ai_generated BOOLEAN DEFAULT 1,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX ix_translations_id ON translations (id)
        """))
        
        conn.execute(text("""
            CREATE INDEX ix_translations_menu_item_id ON translations (menu_item_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX ix_translations_language_code ON translations (language_code)
        """))
        
        conn.commit()
        print("✓ Successfully created translations table and indexes.")

if __name__ == "__main__":
    print("Running translations migration...")
    migrate()
    print("✓ Migration completed successfully!")

