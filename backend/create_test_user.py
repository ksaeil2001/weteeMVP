#!/usr/bin/env python3
"""
Create test user for F-007 profile testing
"""

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
from datetime import datetime

db = SessionLocal()

# Check if user already exists
existing = db.query(User).filter(User.email == "test@example.com").first()
if existing:
    print(f"User already exists: {existing.email}")
else:
    # Create test teacher
    user = User(
        email="test@example.com",
        password_hash=hash_password("Test1234!"),
        name="Test Teacher",
        phone="010-1234-5678",
        role=UserRole.TEACHER,
        is_active=True,
        is_email_verified=True,
        language="ko",
        timezone="Asia/Seoul",
    )
    db.add(user)
    db.commit()
    print(f"✅ Created test user: {user.email}")

db.close()
