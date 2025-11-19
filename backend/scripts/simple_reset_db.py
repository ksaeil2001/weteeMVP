#!/usr/bin/env python3
"""
Simple database reset script without dependencies on security modules
"""
import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import database and models
from app.database import Base, engine

def backup_and_delete_db():
    """Backup and delete existing database"""
    db_path = "wetee.db"

    if os.path.exists(db_path):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{db_path}.backup_{timestamp}"

        try:
            with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
                dst.write(src.read())
            print(f"💾 Backup created: {backup_path}")
        except Exception as e:
            print(f"⚠️  Backup failed: {e}")

        try:
            os.remove(db_path)
            print(f"🗑️  Deleted old database: {db_path}")
        except Exception as e:
            print(f"❌ Failed to delete database: {e}")
            sys.exit(1)

def create_all_tables():
    """Create all tables"""
    print("🏗️  Creating tables...")

    # Import all models to register them
    from app.models import user
    from app.models import group
    from app.models import schedule
    from app.models import attendance
    from app.models import lesson
    from app.models import textbook
    from app.models import invoice
    from app.models import notification
    from app.models import settings

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # List created tables
    table_names = list(Base.metadata.tables.keys())
    print(f"✅ Tables created: {', '.join(table_names)}")

def main():
    print("=" * 60)
    print("🔄 WeTee Database Reset (Simple)")
    print("=" * 60)
    print()

    backup_and_delete_db()
    create_all_tables()

    print()
    print("=" * 60)
    print("✨ Database reset complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
