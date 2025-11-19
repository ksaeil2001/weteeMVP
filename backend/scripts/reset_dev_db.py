#!/usr/bin/env python3
"""
개발용 DB 리셋 스크립트

⚠️  경고: 이 스크립트는 개발 환경에서만 사용하세요!
       운영 환경에서는 절대 실행하지 마세요!

기능:
1. 기존 DB 파일 삭제 (백업 생성)
2. 새 DB 파일 생성 및 테이블 초기화
3. (선택) 테스트용 샘플 데이터 시드

사용법:
  Windows PowerShell:
    PS C:\\Users\\ksaei\\Projects\\weteeMVP\\backend> python scripts\\reset_dev_db.py

  Linux/Mac:
    $ cd /path/to/weteeMVP/backend
    $ python scripts/reset_dev_db.py

옵션:
  --seed    테스트용 유저 데이터 추가
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# 프로젝트 루트를 PYTHONPATH에 추가
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def backup_existing_db(db_path: str) -> None:
    """기존 DB 파일을 백업합니다."""
    if not os.path.exists(db_path):
        print("📭 No existing database file found. Will create a new one.")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_{timestamp}"

    try:
        # 파일 복사 (shutil 대신 직접 읽기/쓰기)
        with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
            dst.write(src.read())
        print(f"💾 Backup created: {backup_path}")
    except Exception as e:
        print(f"⚠️  Backup failed: {e}")


def delete_db_file(db_path: str) -> None:
    """DB 파일을 삭제합니다."""
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"🗑️  Deleted old database: {db_path}")
        except Exception as e:
            print(f"❌ Failed to delete database: {e}")
            sys.exit(1)


def create_tables() -> None:
    """모든 테이블을 생성합니다."""
    print("🏗️  Creating tables...")

    # 모델 임포트 (테이블 등록)
    # 모든 모델을 임포트해야 테이블이 생성됨
    from app.models import user  # noqa: F401
    from app.models import group  # noqa: F401
    from app.models import schedule  # noqa: F401
    from app.models import attendance  # noqa: F401
    from app.models import lesson  # noqa: F401
    from app.models import textbook  # noqa: F401
    from app.models import invoice  # noqa: F401
    from app.models import notification  # noqa: F401
    from app.models import settings  # noqa: F401

    # 테이블 생성
    Base.metadata.create_all(bind=engine)

    # 생성된 테이블 목록
    table_names = list(Base.metadata.tables.keys())
    print(f"✅ Tables created: {', '.join(table_names)}")


def seed_test_users() -> None:
    """테스트용 유저 데이터를 추가합니다."""
    print("\n🌱 Seeding test users...")

    db = SessionLocal()
    try:
        # 테스트용 선생님
        teacher = User(
            email="teacher@test.com",
            password_hash=hash_password("password123"),
            name="김선생",
            phone="010-1234-5678",
            role=UserRole.TEACHER,
            is_active=True,
            is_email_verified=True,
        )
        db.add(teacher)

        # 테스트용 학생
        student = User(
            email="student@test.com",
            password_hash=hash_password("password123"),
            name="이학생",
            phone="010-2345-6789",
            role=UserRole.STUDENT,
            is_active=True,
            is_email_verified=True,
        )
        db.add(student)

        # 테스트용 학부모
        parent = User(
            email="parent@test.com",
            password_hash=hash_password("password123"),
            name="박학부모",
            phone="010-3456-7890",
            role=UserRole.PARENT,
            is_active=True,
            is_email_verified=True,
        )
        db.add(parent)

        db.commit()

        print("✅ Test users created:")
        print("   📧 teacher@test.com / password123 (선생님)")
        print("   📧 student@test.com / password123 (학생)")
        print("   📧 parent@test.com / password123 (학부모)")

    except Exception as e:
        print(f"❌ Failed to seed test users: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🔄 WeTee Development Database Reset")
    print("=" * 60)
    print()

    # 환경 확인
    if not settings.DEBUG:
        print("❌ ERROR: This script should only run in DEBUG mode!")
        print("   Set DEBUG=True in your .env or config.py")
        sys.exit(1)

    # DB 경로 확인
    if "sqlite" not in settings.DATABASE_URL:
        print("❌ ERROR: This script only supports SQLite!")
        print(f"   Current DATABASE_URL: {settings.DATABASE_URL}")
        sys.exit(1)

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    abs_db_path = os.path.abspath(db_path)

    print(f"📂 Database path: {abs_db_path}")
    print()

    # 사용자 확인
    if os.path.exists(abs_db_path):
        response = input("⚠️  This will DELETE the existing database. Continue? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("❌ Aborted.")
            sys.exit(0)

    # 1. 백업
    backup_existing_db(abs_db_path)

    # 2. 삭제
    delete_db_file(abs_db_path)

    # 3. 테이블 생성
    create_tables()

    # 4. 시드 데이터 (옵션)
    if "--seed" in sys.argv:
        seed_test_users()
    else:
        print("\n💡 Tip: Run with --seed to add test users")
        print("   Example: python scripts/reset_dev_db.py --seed")

    print()
    print("=" * 60)
    print("✨ Database reset complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
