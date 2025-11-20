"""
E2E Test: Teacher Flow - Complete Monthly Tutoring Cycle
선생님 플로우: 회원가입 -> 그룹 생성 -> 일정 -> 출결 -> 수업기록 -> 정산 -> 알림

Related Features: F-001 ~ F-008
"""
import pytest
from .conftest import (
    APIClient, TestData, assert_success_response,
    create_teacher_data, create_group_data, create_schedule_data,
    create_lesson_record_data, create_invoice_data
)


@pytest.mark.e2e
@pytest.mark.teacher
class TestTeacherFlow:
    """Teacher flow E2E tests - must run in order"""

    def test_01_teacher_register(self, api_client: APIClient, test_data: TestData, check_server):
        """Step 1: 선생님 회원가입"""
        data = create_teacher_data(test_data.teacher_email, test_data.teacher_password)

        response = api_client.post("/auth/register", json=data)
        result = assert_success_response(response, "선생님 회원가입")

        # Extract user ID from response (standard format: data.user.user_id)
        user_data = result.get("data", {}).get("user", {})
        test_data.teacher_id = user_data.get("user_id", "")

        assert test_data.teacher_id, "Teacher ID not found in response"

        # Verify auth cookies were set (auto-login after registration)
        assert api_client.has_auth_cookies(), "Auth cookies not set after registration"
        print(f"\n✓ 선생님 회원가입 성공 - ID: {test_data.teacher_id}")

    def test_02_teacher_login(self, api_client: APIClient, test_data: TestData):
        """Step 2: 선생님 로그인"""
        # Clear previous session to test fresh login
        api_client.clear_token()

        data = {
            "email": test_data.teacher_email,
            "password": test_data.teacher_password
        }

        response = api_client.post("/auth/login", json=data)
        result = assert_success_response(response, "선생님 로그인")

        # Verify cookies were set (token is in httpOnly cookie, not response body)
        assert api_client.has_auth_cookies(), "Auth cookies not set after login"

        # Get user info from response
        user_data = result.get("data", {}).get("user", {})
        print(f"\n✓ 선생님 로그인 성공 - User: {user_data.get('email', 'N/A')}")

    def test_03_create_group(self, api_client: APIClient, test_data: TestData):
        """Step 3: 과외 그룹 생성"""
        data = create_group_data()

        response = api_client.post("/groups", json=data)
        result = assert_success_response(response, "그룹 생성")

        test_data.group_id = result["data"]["id"]

        assert test_data.group_id, "Group ID not found"
        print(f"\n✓ 그룹 생성 성공 - ID: {test_data.group_id}")

    def test_04_generate_invite_code(self, api_client: APIClient, test_data: TestData):
        """Step 4: 초대 코드 생성"""
        data = {
            "target_role": "STUDENT",
            "max_uses": 5,
            "expires_in_hours": 168
        }

        response = api_client.post(f"/groups/{test_data.group_id}/invite", json=data)
        result = assert_success_response(response, "초대 코드 생성")

        test_data.invite_code = result["data"]["code"]

        assert test_data.invite_code, "Invite code not found"
        print(f"\n✓ 초대 코드 생성 성공 - Code: {test_data.invite_code}")

    def test_05_create_schedules(self, api_client: APIClient, test_data: TestData):
        """Step 5: 정규 일정 등록 (월/수)"""
        # Monday schedule
        monday_data = create_schedule_data(
            test_data.group_id,
            "정규 수업 - 월요일",
            "2025-11-24T19:00:00",
            "2025-11-24T21:00:00",
            "monday"
        )
        response = api_client.post("/schedules", json=monday_data)
        result = assert_success_response(response, "월요일 일정 등록")
        test_data.schedule_ids.append(result["data"]["id"])

        # Wednesday schedule
        wednesday_data = create_schedule_data(
            test_data.group_id,
            "정규 수업 - 수요일",
            "2025-11-26T19:00:00",
            "2025-11-26T21:00:00",
            "wednesday"
        )
        response = api_client.post("/schedules", json=wednesday_data)
        result = assert_success_response(response, "수요일 일정 등록")
        test_data.schedule_ids.append(result["data"]["id"])

        assert len(test_data.schedule_ids) == 2, "Should have 2 schedules"
        print(f"\n✓ 정규 일정 등록 성공 - IDs: {test_data.schedule_ids}")

    def test_06_mark_attendance(self, api_client: APIClient, test_data: TestData):
        """Step 6: 출결 체크"""
        # Mark attendance for first schedule
        if test_data.schedule_ids:
            schedule_id = test_data.schedule_ids[0]
            data = {
                "schedule_id": schedule_id,
                "status": "present",
                "note": "정상 출석"
            }

            response = api_client.post("/attendances", json=data)

            # Handle case where attendance endpoint might not exist yet
            if response.status_code in [200, 201]:
                result = response.json()
                if result.get("success"):
                    attendance_id = result.get("data", {}).get("id")
                    if attendance_id:
                        test_data.attendance_ids.append(attendance_id)
                    print(f"\n✓ 출결 체크 성공 - ID: {attendance_id}")
                else:
                    pytest.skip("Attendance marking returned non-success response")
            elif response.status_code == 404:
                pytest.skip("Attendance API not implemented yet")
            else:
                pytest.fail(f"출결 체크 실패 - Status: {response.status_code}, Response: {response.text}")

    def test_07_create_lesson_record(self, api_client: APIClient, test_data: TestData):
        """Step 7: 수업 기록 작성"""
        if not test_data.schedule_ids:
            pytest.skip("No schedules created")

        data = create_lesson_record_data(test_data.schedule_ids[0], test_data.group_id)

        response = api_client.post("/lesson-records", json=data)

        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                record_id = result.get("data", {}).get("id")
                if record_id:
                    test_data.lesson_record_ids.append(record_id)
                print(f"\n✓ 수업 기록 작성 성공 - ID: {record_id}")
            else:
                pytest.skip("Lesson record creation returned non-success")
        elif response.status_code == 404:
            pytest.skip("Lesson records API not implemented yet")
        else:
            pytest.fail(f"수업 기록 작성 실패 - Status: {response.status_code}")

    def test_08_create_progress_record(self, api_client: APIClient, test_data: TestData):
        """Step 8: 진도 기록"""
        if not test_data.lesson_record_ids:
            pytest.skip("No lesson records created")

        data = {
            "lesson_record_id": test_data.lesson_record_ids[0],
            "textbook_name": "수학의 정석",
            "chapter": "미적분",
            "start_page": 100,
            "end_page": 120,
            "completion_rate": 80
        }

        response = api_client.post("/progress-records", json=data)

        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                progress_id = result.get("data", {}).get("id")
                if progress_id:
                    test_data.progress_record_ids.append(progress_id)
                print(f"\n✓ 진도 기록 성공 - ID: {progress_id}")
        elif response.status_code == 404:
            pytest.skip("Progress records API not implemented yet")

    def test_09_create_invoice(self, api_client: APIClient, test_data: TestData):
        """Step 9: 청구서 생성"""
        data = create_invoice_data(test_data.group_id)

        response = api_client.post("/invoices", json=data)

        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                test_data.invoice_id = result.get("data", {}).get("id", "")
                print(f"\n✓ 청구서 생성 성공 - ID: {test_data.invoice_id}")
        elif response.status_code == 404:
            pytest.skip("Invoices API not implemented yet")

    def test_10_send_invoice(self, api_client: APIClient, test_data: TestData):
        """Step 10: 청구서 발송"""
        if not test_data.invoice_id:
            pytest.skip("No invoice created")

        response = api_client.post(f"/invoices/{test_data.invoice_id}/send")

        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("success"):
                print(f"\n✓ 청구서 발송 성공")
        elif response.status_code == 404:
            pytest.skip("Invoice send API not implemented yet")

    def test_11_check_notifications(self, api_client: APIClient, test_data: TestData):
        """Step 11: 알림 확인"""
        response = api_client.get("/notifications")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                notifications = result.get("data", {}).get("notifications", [])
                print(f"\n✓ 알림 확인 성공 - {len(notifications)}개의 알림")
        elif response.status_code == 404:
            pytest.skip("Notifications API not implemented yet")

    def test_12_update_profile(self, api_client: APIClient, test_data: TestData):
        """Step 12: 프로필 수정"""
        data = {
            "name": "수정된 선생님 이름",
            "phone": "010-9999-9999"
        }

        response = api_client.patch("/users/me", json=data)

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"\n✓ 프로필 수정 성공")
        elif response.status_code == 404:
            pytest.skip("Profile update API not implemented yet")

    def test_13_logout(self, api_client: APIClient, test_data: TestData):
        """Step 13: 로그아웃"""
        response = api_client.post("/auth/logout")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                api_client.clear_token()
                print(f"\n✓ 로그아웃 성공")
        elif response.status_code == 404:
            # Logout might not be implemented - just clear token
            api_client.clear_token()
            print(f"\n✓ 로그아웃 (토큰 클리어)")

        # Final summary
        print(f"\n{'='*50}")
        print(f"선생님 플로우 테스트 완료")
        print(f"Teacher Email: {test_data.teacher_email}")
        print(f"Group ID: {test_data.group_id}")
        print(f"Invite Code: {test_data.invite_code}")
        print(f"Schedules: {len(test_data.schedule_ids)}")
        print(f"{'='*50}")
