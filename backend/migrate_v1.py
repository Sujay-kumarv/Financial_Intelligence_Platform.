import sqlite3
import os

db_path = "financial_intelligence.db"

def migrate():
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add new columns to companies table
    columns_to_add = [
        ("region", "TEXT"),
        ("data_source", "TEXT"),
        ("metadata", "JSON"),
        ("last_synced", "DATETIME")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name} to companies table...")
            cursor.execute(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type}")
            print(f"[OK] Added {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"[WARN] Column {col_name} already exists.")
            else:
                print(f"[ERROR] Could not add column {col_name}: {e}")
    
    conn.commit()
    conn.close()
    
    # Now run init_db to create new tables
    print("\nRunning init_db to create new tables...")
    from init_db import init_db
    init_db()

if __name__ == "__main__":
    migrate()
    print("\nMigration complete!")
