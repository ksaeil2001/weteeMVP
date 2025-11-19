#!/usr/bin/env python3
"""
Verify Foreign Key constraints in SQLite database
"""
import sqlite3
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def verify_foreign_keys():
    """Verify all foreign key constraints in the database"""
    db_path = "wetee.db"

    if not Path(db_path).exists():
        print(f"❌ Database file not found: {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]

    print("=" * 80)
    print("🔍 Foreign Key Constraints Verification")
    print("=" * 80)
    print()

    total_fks = 0

    for table in tables:
        # Get foreign key list for each table
        cursor.execute(f"PRAGMA foreign_key_list({table})")
        fks = cursor.fetchall()

        if fks:
            print(f"📋 Table: {table}")
            print("─" * 80)

            for fk in fks:
                # fk structure: (id, seq, table, from, to, on_update, on_delete, match)
                fk_id, seq, ref_table, from_col, to_col, on_update, on_delete, match = fk

                ondelete_str = f"ON DELETE {on_delete}" if on_delete != "NO ACTION" else ""
                print(f"  • {from_col} → {ref_table}({to_col}) {ondelete_str}")
                total_fks += 1

            print()

    print("=" * 80)
    print(f"✅ Total Foreign Key constraints found: {total_fks}")
    print("=" * 80)
    print()

    # Verify specific critical FK constraints
    print("🔍 Verifying Critical FK Constraints:")
    print("─" * 80)

    critical_checks = [
        ("groups", "owner_id", "users", "CASCADE"),
        ("group_members", "user_id", "users", "CASCADE"),
        ("group_members", "group_id", "groups", "CASCADE"),
        ("invite_codes", "created_by", "users", "CASCADE"),
        ("schedules", "original_schedule_id", "schedules", "SET NULL"),
        ("notifications", "user_id", "users", "CASCADE"),
        ("attendances", "schedule_id", "schedules", "CASCADE"),
        ("lesson_records", "schedule_id", "schedules", "CASCADE"),
        ("textbooks", "group_id", "groups", "CASCADE"),
    ]

    all_passed = True

    for table, from_col, ref_table, expected_ondelete in critical_checks:
        cursor.execute(f"PRAGMA foreign_key_list({table})")
        fks = cursor.fetchall()

        found = False
        for fk in fks:
            fk_id, seq, fk_ref_table, fk_from_col, to_col, on_update, on_delete, match = fk

            if fk_from_col == from_col and fk_ref_table == ref_table:
                found = True
                if on_delete == expected_ondelete:
                    print(f"  ✅ {table}.{from_col} → {ref_table} ON DELETE {on_delete}")
                else:
                    print(f"  ⚠️  {table}.{from_col} → {ref_table} expected ON DELETE {expected_ondelete}, got {on_delete}")
                    all_passed = False
                break

        if not found:
            print(f"  ❌ {table}.{from_col} → {ref_table} NOT FOUND")
            all_passed = False

    print()

    if all_passed:
        print("✅ All critical FK constraints verified successfully!")
    else:
        print("⚠️  Some FK constraints are missing or incorrect")

    conn.close()

if __name__ == "__main__":
    verify_foreign_keys()
