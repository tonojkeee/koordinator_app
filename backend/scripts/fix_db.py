import sqlite3
import os

# Absolute path to be sure
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "teamchat.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Attempting to add updated_at column to messages table...")
        cursor.execute("ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP")
        conn.commit()
        print("✅ Successfully added updated_at column!")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("ℹ️ Column updated_at already exists.")
        else:
            print(f"❌ Error adding column: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
