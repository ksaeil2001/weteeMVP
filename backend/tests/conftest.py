"""
Pytest Configuration and Fixtures for WeTee MVP Backend Tests

This file contains shared fixtures used across all test files.

Key Fixtures:
- db_session: Test database session (SQLite in-memory)
- client: FastAPI TestClient for API testing
- test_user: Pre-created test user
- auth_headers: Authorization headers for authenticated requests
"""

import sys
import os
from typing import Generator, Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.core.security import hash_password, create_access_token


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def db_engine():
    """
    Create a test database engine (SQLite in-memory).

    Scope: function (new DB for each test)
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """
    Create a test database session.

    Scope: function (new session for each test)

    Usage:
        def test_something(db_session):
            user = User(email="test@example.com", ...)
            db_session.add(user)
            db_session.commit()
    """
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=db_engine
    )

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """
    Create a FastAPI TestClient with test database.

    Scope: function (new client for each test)

    Usage:
        def test_api(client):
            response = client.post("/api/v1/auth/login", json={...})
            assert response.status_code == 200
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_teacher(db_session) -> User:
    """
    Create a test teacher user.

    Returns:
        User: Teacher user with email teacher@test.com
    """
    user = User(
        email="teacher@test.com",
        password_hash=hash_password("password123"),
        name="Test Teacher",
        phone="010-1234-5678",
        role=UserRole.TEACHER,
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_student(db_session) -> User:
    """
    Create a test student user.

    Returns:
        User: Student user with email student@test.com
    """
    user = User(
        email="student@test.com",
        password_hash=hash_password("password123"),
        name="Test Student",
        phone="010-2345-6789",
        role=UserRole.STUDENT,
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_parent(db_session) -> User:
    """
    Create a test parent user.

    Returns:
        User: Parent user with email parent@test.com
    """
    user = User(
        email="parent@test.com",
        password_hash=hash_password("password123"),
        name="Test Parent",
        phone="010-3456-7890",
        role=UserRole.PARENT,
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def teacher_auth_headers(test_teacher) -> Dict[str, str]:
    """
    Generate authentication headers for teacher user.

    Returns:
        Dict[str, str]: {"Authorization": "Bearer <token>"}
    """
    access_token = create_access_token(data={"sub": test_teacher.id})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def student_auth_headers(test_student) -> Dict[str, str]:
    """
    Generate authentication headers for student user.

    Returns:
        Dict[str, str]: {"Authorization": "Bearer <token>"}
    """
    access_token = create_access_token(data={"sub": test_student.id})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def parent_auth_headers(test_parent) -> Dict[str, str]:
    """
    Generate authentication headers for parent user.

    Returns:
        Dict[str, str]: {"Authorization": "Bearer <token>"}
    """
    access_token = create_access_token(data={"sub": test_parent.id})
    return {"Authorization": f"Bearer {access_token}"}


# ============================================================================
# Test Data Factories (using faker)
# ============================================================================

@pytest.fixture(scope="session")
def faker_instance():
    """
    Create a Faker instance for generating test data.

    Usage:
        def test_something(faker_instance):
            email = faker_instance.email()
            name = faker_instance.name()
    """
    from faker import Faker
    return Faker(locale="ko_KR")  # Korean locale for Korean names/addresses
