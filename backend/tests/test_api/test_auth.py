"""
Authentication API Tests - F-001

Tests for:
- POST /api/v1/auth/register: User registration
- POST /api/v1/auth/login: User login
- GET /api/v1/auth/account: Get current user account
- POST /api/v1/auth/refresh: Token refresh
- POST /api/v1/auth/logout: User logout

Related: F-001_회원가입_및_로그인.md, API_명세서.md 6.1
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
@pytest.mark.auth
class TestAuthRegister:
    """
    회원가입 테스트
    POST /api/v1/auth/register
    """

    def test_register_teacher_success(self, client: TestClient):
        """
        정상 회원가입 (선생님)
        """
        payload = {
            "email": "newteacher@test.com",
            "password": "SecurePass123!",
            "name": "신규 선생님",
            "phone": "010-9999-8888",
            "role": "TEACHER"
        }

        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == payload["email"].lower()
        assert data["name"] == payload["name"]
        assert data["role"] == "teacher"
        assert "user_id" in data
        assert "created_at" in data

    def test_register_duplicate_email(self, client: TestClient, test_teacher):
        """
        이메일 중복 시 409 에러
        """
        payload = {
            "email": test_teacher.email,
            "password": "SecurePass123!",
            "name": "중복 테스트",
            "phone": "010-1111-2222",
            "role": "TEACHER"
        }

        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 409
        data = response.json()
        assert data["detail"]["code"] == "AUTH001"
        assert "이미 가입된 이메일" in data["detail"]["message"]

    def test_register_student_not_implemented(self, client: TestClient):
        """
        학생 가입은 현재 미구현 (501)
        """
        payload = {
            "email": "student@test.com",
            "password": "SecurePass123!",
            "name": "학생",
            "phone": "010-3333-4444",
            "role": "STUDENT"
        }

        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 501
        data = response.json()
        assert data["detail"]["code"] == "COMMON001"

    def test_register_invalid_email(self, client: TestClient):
        """
        잘못된 이메일 형식 (422)
        """
        payload = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "name": "테스트",
            "phone": "010-5555-6666",
            "role": "TEACHER"
        }

        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 422


@pytest.mark.api
@pytest.mark.auth
class TestAuthLogin:
    """
    로그인 테스트
    POST /api/v1/auth/login
    """

    def test_login_success(self, client: TestClient, test_teacher):
        """
        정상 로그인
        """
        payload = {
            "email": test_teacher.email,
            "password": "password123"
        }

        response = client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_teacher.email
        assert data["name"] == test_teacher.name
        assert data["role"] == test_teacher.role.value

    def test_login_wrong_password(self, client: TestClient, test_teacher):
        """
        잘못된 비밀번호 (401)
        """
        payload = {
            "email": test_teacher.email,
            "password": "wrong_password"
        }

        response = client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["code"] == "AUTH004"
        assert "이메일 또는 비밀번호" in data["detail"]["message"]

    def test_login_nonexistent_user(self, client: TestClient):
        """
        존재하지 않는 사용자 (401)
        """
        payload = {
            "email": "nonexistent@test.com",
            "password": "password123"
        }

        response = client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["code"] == "AUTH004"

    def test_login_inactive_user(self, client: TestClient, test_teacher, db_session):
        """
        비활성화된 계정 (403)
        """
        # Deactivate user
        test_teacher.is_active = False
        db_session.commit()

        payload = {
            "email": test_teacher.email,
            "password": "password123"
        }

        response = client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["code"] == "AUTH005"
        assert "비활성화된 계정" in data["detail"]["message"]


@pytest.mark.api
@pytest.mark.auth
class TestAuthAccount:
    """
    현재 사용자 조회 테스트
    GET /api/v1/auth/account
    """

    def test_get_account_success(self, client: TestClient, test_teacher, teacher_auth_headers):
        """
        인증된 사용자 정보 조회
        """
        response = client.get("/api/v1/auth/account", headers=teacher_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_teacher.email
        assert data["name"] == test_teacher.name
        assert data["role"] == test_teacher.role.value

    def test_get_account_unauthorized(self, client: TestClient):
        """
        인증되지 않은 요청 (401)
        """
        response = client.get("/api/v1/auth/account")

        assert response.status_code == 401

    def test_get_account_invalid_token(self, client: TestClient):
        """
        잘못된 토큰 (401)
        """
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/account", headers=headers)

        assert response.status_code == 401


@pytest.mark.api
@pytest.mark.auth
class TestAuthLogout:
    """
    로그아웃 테스트
    POST /api/v1/auth/logout
    """

    def test_logout_success(self, client: TestClient, test_teacher, teacher_auth_headers):
        """
        정상 로그아웃
        """
        response = client.post("/api/v1/auth/logout", headers=teacher_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "로그아웃" in data["message"]

    def test_logout_unauthorized(self, client: TestClient):
        """
        인증되지 않은 로그아웃 시도 (401)
        """
        response = client.post("/api/v1/auth/logout")

        assert response.status_code == 401
