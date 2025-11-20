"""
E2E Test Fixtures and Utilities for WeTee MVP
"""
import pytest
import requests
import time
from typing import Optional
from dataclasses import dataclass, field


# Configuration
API_BASE = "http://localhost:8000/api/v1"


class APIClient:
    """HTTP client wrapper for API testing with cookie support"""

    def __init__(self, base_url: str = API_BASE):
        self.base_url = base_url
        self.session = requests.Session()
        self._token: Optional[str] = None

    def _headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        # Support both cookie-based and header-based auth
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    def get(self, endpoint: str, **kwargs) -> requests.Response:
        return self.session.get(
            f"{self.base_url}{endpoint}",
            headers=self._headers(),
            **kwargs
        )

    def post(self, endpoint: str, json: dict = None, **kwargs) -> requests.Response:
        return self.session.post(
            f"{self.base_url}{endpoint}",
            headers=self._headers(),
            json=json,
            **kwargs
        )

    def put(self, endpoint: str, json: dict = None, **kwargs) -> requests.Response:
        return self.session.put(
            f"{self.base_url}{endpoint}",
            headers=self._headers(),
            json=json,
            **kwargs
        )

    def patch(self, endpoint: str, json: dict = None, **kwargs) -> requests.Response:
        return self.session.patch(
            f"{self.base_url}{endpoint}",
            headers=self._headers(),
            json=json,
            **kwargs
        )

    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        return self.session.delete(
            f"{self.base_url}{endpoint}",
            headers=self._headers(),
            **kwargs
        )

    def set_token(self, token: str):
        """Set token for header-based auth (optional, cookies are preferred)"""
        self._token = token

    def clear_token(self):
        """Clear token and cookies"""
        self._token = None
        self.session.cookies.clear()

    def has_auth_cookies(self) -> bool:
        """Check if authentication cookies are present"""
        return "wetee_access_token" in self.session.cookies


@dataclass
class TestData:
    """Shared test data between tests"""
    teacher_email: str = ""
    teacher_password: str = "Teacher123!"
    teacher_id: str = ""
    teacher_token: str = ""

    parent_email: str = ""
    parent_password: str = "Parent123!"
    parent_id: str = ""
    parent_token: str = ""

    student_email: str = ""
    student_password: str = "Student123!"
    student_id: str = ""
    student_token: str = ""

    group_id: str = ""
    invite_code: str = ""
    schedule_ids: list = field(default_factory=list)
    attendance_ids: list = field(default_factory=list)
    lesson_record_ids: list = field(default_factory=list)
    progress_record_ids: list = field(default_factory=list)
    invoice_id: str = ""
    textbook_id: str = ""


def generate_unique_email(prefix: str) -> str:
    """Generate unique email for testing"""
    timestamp = int(time.time() * 1000)
    return f"{prefix}_{timestamp}@test.com"


def assert_success_response(response: requests.Response, message: str = ""):
    """Assert that API response indicates success"""
    assert response.status_code in [200, 201], \
        f"{message} - Status: {response.status_code}, Response: {response.text}"

    data = response.json()
    assert data.get("success") is True, \
        f"{message} - Response: {data}"

    return data


def assert_error_response(response: requests.Response, expected_status: int, message: str = ""):
    """Assert that API response indicates expected error"""
    assert response.status_code == expected_status, \
        f"{message} - Expected {expected_status}, got {response.status_code}, Response: {response.text}"

    return response.json()


@pytest.fixture(scope="module")
def api_client() -> APIClient:
    """Provide API client for tests"""
    return APIClient()


@pytest.fixture(scope="module")
def test_data() -> TestData:
    """Provide shared test data"""
    data = TestData()
    data.teacher_email = generate_unique_email("teacher_e2e")
    data.parent_email = generate_unique_email("parent_e2e")
    data.student_email = generate_unique_email("student_e2e")
    return data


@pytest.fixture(scope="session")
def check_server():
    """Check if the API server is running"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code != 200:
            pytest.skip("API server is not healthy")
    except requests.exceptions.ConnectionError:
        pytest.skip("API server is not running. Start with: uvicorn app.main:app --reload")


# Test data generators
def create_teacher_data(email: str, password: str = "Teacher123!") -> dict:
    """Generate teacher registration data"""
    return {
        "email": email,
        "password": password,
        "name": "테스트 선생님",
        "phone": "010-1234-5678",
        "role": "TEACHER"
    }


def create_parent_data(email: str, password: str = "Parent123!") -> dict:
    """Generate parent registration data"""
    return {
        "email": email,
        "password": password,
        "name": "테스트 학부모",
        "phone": "010-2345-6789",
        "role": "PARENT"
    }


def create_student_data(email: str, password: str = "Student123!") -> dict:
    """Generate student registration data"""
    return {
        "email": email,
        "password": password,
        "name": "테스트 학생",
        "phone": "010-3456-7890",
        "role": "STUDENT"
    }


def create_group_data() -> dict:
    """Generate group creation data"""
    return {
        "name": "고등수학 과외",
        "subject": "수학",
        "description": "고등학교 수학 개인 과외",
        "lesson_fee": 100000,
        "payment_type": "per_lesson",
        "payment_cycle": 4
    }


def create_schedule_data(group_id: str, title: str, start_at: str, end_at: str, day: str = "monday") -> dict:
    """Generate schedule creation data"""
    return {
        "group_id": group_id,
        "title": title,
        "type": "regular",
        "start_at": start_at,
        "end_at": end_at,
        "status": "confirmed",
        "recurrence_rule": {
            "frequency": "weekly",
            "interval": 1,
            "by_day": [day]
        },
        "location": "강남역 스터디카페",
        "memo": f"{title} 메모"
    }


def create_lesson_record_data(schedule_id: str, group_id: str) -> dict:
    """Generate lesson record data"""
    return {
        "schedule_id": schedule_id,
        "group_id": group_id,
        "summary": "오늘 수업 내용 요약",
        "homework": "교재 20-25페이지 문제 풀기",
        "next_plan": "다음 수업에서 복습 후 진도 나가기"
    }


def create_invoice_data(group_id: str, total_amount: int = 400000) -> dict:
    """Generate invoice creation data"""
    return {
        "group_id": group_id,
        "total_amount": total_amount,
        "due_date": "2025-12-01",
        "description": "11월 수업료 청구"
    }
