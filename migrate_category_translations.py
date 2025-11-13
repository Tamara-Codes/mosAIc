"""
Migration script to add category_translations table
Run this with: python migrate_category_translations.py
"""
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SQL to create the category_translations table
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS category_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    language_name VARCHAR(50) NOT NULL,
    name VARCHAR NOT NULL,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_category_translations_id ON category_translations(id);
CREATE INDEX IF NOT EXISTS ix_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS ix_category_translations_language_code ON category_translations(language_code);
"""

def run_migration():
    print("Running migration to add category_translations table...")
    
    with engine.connect() as conn:
        # Execute the SQL
        for statement in CREATE_TABLE_SQL.strip().split(';'):
            if statement.strip():
                conn.execute(text(statement))
        conn.commit()
    
    print("✅ Migration completed successfully!")
    print("   - category_translations table created")
    print("   - Indexes created")

if __name__ == "__main__":
    run_migration()

