"""
Database connection and session management
SQLAlchemy 엔진 및 세션 설정
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create SQLAlchemy engine
# For SQLite, we need to use check_same_thread=False
# For PostgreSQL, this parameter is not needed
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# SessionLocal class for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    Usage: db: Session = Depends(get_db)

    데이터베이스 세션을 제공하는 의존성 함수
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database - create all tables
    테이블 생성 (개발 환경용, 운영에서는 Alembic 사용)
    """
    import os
    from app.models import user  # Import models to register them
    from app.config import settings

    # DB 파일 경로 확인 (SQLite인 경우)
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        abs_path = os.path.abspath(db_path)
        print(f"📁 Database file: {abs_path}")

        # DB 파일이 이미 존재하는지 확인
        if os.path.exists(abs_path):
            print(f"✅ Existing database found")
        else:
            print(f"🆕 Creating new database file...")

    # 테이블 생성
    Base.metadata.create_all(bind=engine)

    # 생성된 테이블 목록 출력
    table_names = Base.metadata.tables.keys()
    print(f"📊 Tables in database: {', '.join(table_names)}")
