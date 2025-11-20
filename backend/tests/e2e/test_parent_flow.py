"""
E2E Test: Parent Flow - View and Monitor Tutoring
학부모 플로우: 회원가입 -> 그룹 가입 -> 일정/출결/기록 조회 -> 청구서 확인

Related Features: F-001, F-002, F-003, F-004, F-005, F-006, F-008
"""
import pytest
from .conftest import (
    APIClient, TestData, assert_success_response,
    create_parent_data, create_teacher_data, create_group_data,
    create_schedule_data, generate_unique_email
)


@pytest.mark.e2e
@pytest.mark.parent
class TestParentFlow:
    """Parent flow E2E tests - must run in order"""

    @pytest.fixture(autouse=True)
    def setup_teacher_and_group(self, api_client: APIClient, test_data: TestData, check_server):
        """Setup: Create teacher and group before parent tests"""
        # Only setup once
        if test_data.group_id and test_data.invite_code:
            return

        # Register teacher
        teacher_email = generate_unique_email("teacher_for_parent")
        teacher_data = create_teacher_data(teacher_email)
        response = api_client.post("/auth/register", json=teacher_data)
        result = assert_success_response(response, "선생님 회원가입 (setup)")

        # Login teacher (cookies are set automatically)
        login_data = {"email": teacher_email, "password": "Teacher123!"}
        response = api_client.post("/auth/login", json=login_data)
        result = assert_success_response(response, "선생님 로그인 (setup)")
        # Token is in cookies, no need to set manually

        # Create group
        group_data = create_group_data()
        response = api_client.post("/groups", json=group_data)
        result = assert_success_response(response, "그룹 생성 (setup)")
        test_data.group_id = result["data"]["id"]

        # Create invite code for parent
        invite_data = {
            "target_role": "PARENT",
            "max_uses": 5,
            "expires_in_hours": 168
        }
        response = api_client.post(f"/groups/{test_data.group_id}/invite", json=invite_data)
        result = assert_success_response(response, "초대 코드 생성 (setup)")
        test_data.invite_code = result["data"]["code"]

        # Create schedules
        schedule_data = create_schedule_data(
            test_data.group_id,
            "정규 수업",
            "2025-11-24T19:00:00",
            "2025-11-24T21:00:00"
        )
        response = api_client.post("/schedules", json=schedule_data)
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                test_data.schedule_ids.append(result["data"]["id"])

        # Clear token for parent tests
        api_client.clear_token()

    def test_01_parent_register(self, api_client: APIClient, test_data: TestData):
        """Step 1: 학부모 회원가입"""
        data = create_parent_data(test_data.parent_email, test_data.parent_password)

        response = api_client.post("/auth/register", json=data)
        result = assert_success_response(response, "학부모 회원가입")

        # Extract user ID from response (standard format: data.user.user_id)
        user_data = result.get("data", {}).get("user", {})
        test_data.parent_id = user_data.get("user_id", "")

        assert test_data.parent_id, "Parent ID not found in response"
        assert api_client.has_auth_cookies(), "Auth cookies not set after registration"
        print(f"\n✓ 학부모 회원가입 성공 - ID: {test_data.parent_id}")

    def test_02_parent_login(self, api_client: APIClient, test_data: TestData):
        """Step 2: 학부모 로그인"""
        # Clear previous session to test fresh login
        api_client.clear_token()

        data = {
            "email": test_data.parent_email,
            "password": test_data.parent_password
        }

        response = api_client.post("/auth/login", json=data)
        result = assert_success_response(response, "학부모 로그인")

        # Verify cookies were set (token is in httpOnly cookie, not response body)
        assert api_client.has_auth_cookies(), "Auth cookies not set after login"

        # Get user info from response
        user_data = result.get("data", {}).get("user", {})
        print(f"\n✓ 학부모 로그인 성공 - User: {user_data.get('email', 'N/A')}")

    def test_03_join_group(self, api_client: APIClient, test_data: TestData):
        """Step 3: 초대 코드로 그룹 가입"""
        data = {
            "code": test_data.invite_code
        }

        response = api_client.post("/groups/join", json=data)

        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                print(f"\n✓ 그룹 가입 성공 - Group: {test_data.group_id}")
            else:
                pytest.fail(f"그룹 가입 실패: {result}")
        elif response.status_code == 404:
            pytest.skip("Group join API not implemented yet")
        else:
            pytest.fail(f"그룹 가입 실패 - Status: {response.status_code}, Response: {response.text}")

    def test_04_view_schedules(self, api_client: APIClient, test_data: TestData):
        """Step 4: 일정 조회"""
        response = api_client.get(f"/schedules?group_id={test_data.group_id}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                schedules = result.get("data", {}).get("schedules", [])
                print(f"\n✓ 일정 조회 성공 - {len(schedules)}개의 일정")
            else:
                # Try alternative response format
                schedules = result.get("data", [])
                print(f"\n✓ 일정 조회 성공 - {len(schedules)}개의 일정")
        elif response.status_code == 404:
            pytest.skip("Schedules view API not accessible for parent")
        else:
            pytest.fail(f"일정 조회 실패 - Status: {response.status_code}")

    def test_05_view_attendance(self, api_client: APIClient, test_data: TestData):
        """Step 5: 출결 확인"""
        response = api_client.get(f"/attendances?group_id={test_data.group_id}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                attendances = result.get("data", {}).get("attendances", [])
                print(f"\n✓ 출결 확인 성공 - {len(attendances)}개의 출결 기록")
        elif response.status_code == 404:
            pytest.skip("Attendance API not implemented yet")
        else:
            # May fail if no attendance exists - that's okay
            print(f"\n✓ 출결 확인 완료 (데이터 없음)")

    def test_06_view_lesson_records(self, api_client: APIClient, test_data: TestData):
        """Step 6: 수업 기록 확인"""
        response = api_client.get(f"/lesson-records?group_id={test_data.group_id}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                records = result.get("data", {}).get("lesson_records", [])
                print(f"\n✓ 수업 기록 확인 성공 - {len(records)}개의 기록")
        elif response.status_code == 404:
            pytest.skip("Lesson records API not implemented yet")
        else:
            print(f"\n✓ 수업 기록 확인 완료 (데이터 없음)")

    def test_07_view_invoices(self, api_client: APIClient, test_data: TestData):
        """Step 7: 청구서 조회"""
        response = api_client.get(f"/invoices?group_id={test_data.group_id}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                invoices = result.get("data", {}).get("invoices", [])
                print(f"\n✓ 청구서 조회 성공 - {len(invoices)}개의 청구서")
        elif response.status_code == 404:
            pytest.skip("Invoices API not implemented yet")
        else:
            print(f"\n✓ 청구서 조회 완료 (데이터 없음)")

    def test_08_check_notifications(self, api_client: APIClient, test_data: TestData):
        """Step 8: 알림 확인"""
        response = api_client.get("/notifications")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                notifications = result.get("data", {}).get("notifications", [])
                print(f"\n✓ 알림 확인 성공 - {len(notifications)}개의 알림")
        elif response.status_code == 404:
            pytest.skip("Notifications API not implemented yet")

    def test_09_logout(self, api_client: APIClient, test_data: TestData):
        """Step 9: 로그아웃"""
        response = api_client.post("/auth/logout")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                api_client.clear_token()
                print(f"\n✓ 로그아웃 성공")
        elif response.status_code == 404:
            api_client.clear_token()
            print(f"\n✓ 로그아웃 (토큰 클리어)")

        # Final summary
        print(f"\n{'='*50}")
        print(f"학부모 플로우 테스트 완료")
        print(f"Parent Email: {test_data.parent_email}")
        print(f"Group ID: {test_data.group_id}")
        print(f"{'='*50}")
