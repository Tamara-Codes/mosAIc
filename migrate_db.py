#!/usr/bin/env python3
"""
Migration script to add 'order' column to categories table if it doesn't exist.
This is helpful for databases created before the ordering feature was added.
"""

import sqlite3
import sys

def migrate_db():
    try:
        conn = sqlite3.connect('menu.db')
        cursor = conn.cursor()
        
        # Check if the 'order' column already exists
        cursor.execute("PRAGMA table_info(categories)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'order' not in columns:
            print("Adding 'order' column to categories table...")
            cursor.execute("ALTER TABLE categories ADD COLUMN 'order' INTEGER DEFAULT 0")
            
            # Set order based on ID for existing categories
            cursor.execute("UPDATE categories SET 'order' = id - 1")
            
            conn.commit()
            print("✅ Migration successful! 'order' column has been added.")
        else:
            print("ℹ️  'order' column already exists. No migration needed.")
        
        conn.close()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_db()

