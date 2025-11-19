"""
Schedule Management API Tests - F-003

Tests for:
- POST /api/v1/groups/{group_id}/schedules: Create schedule
- GET /api/v1/groups/{group_id}/schedules: List schedules
- PUT /api/v1/schedules/{schedule_id}: Update schedule
- DELETE /api/v1/schedules/{schedule_id}: Delete schedule

Related: F-003_수업_일정_관리.md, API_명세서.md 6.3
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.models.group import Group
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus


@pytest.mark.api
@pytest.mark.schedules
class TestScheduleCreate:
    """
    수업 일정 생성 테스트
    POST /api/v1/groups/{group_id}/schedules
    """

    def test_create_schedule_success(self, client: TestClient, test_teacher, teacher_auth_headers, db_session):
        """
        정규 수업 일정 생성 성공
        """
        # Create test group
        group = Group(
            name="수학 그룹",
            subject="수학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Schedule payload
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)

        payload = {
            "title": "고등수학 1단원",
            "start_at": start_time.isoformat(),
            "end_at": end_time.isoformat(),
            "schedule_type": "REGULAR",
            "location": "온라인 (Zoom)"
        }

        response = client.post(
            f"/api/v1/groups/{group.id}/schedules",
            json=payload,
            headers=teacher_auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["schedule_type"] == "REGULAR"
        assert data["group_id"] == group.id

    def test_create_schedule_unauthorized(self, client: TestClient, db_session):
        """
        인증되지 않은 일정 생성 시도 (401)
        """
        # Create test group
        group = Group(
            name="수학 그룹",
            subject="수학",
            owner_id="fake-owner-id"
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)

        payload = {
            "title": "수학 수업",
            "start_at": start_time.isoformat(),
            "end_at": end_time.isoformat(),
            "schedule_type": "REGULAR"
        }

        response = client.post(f"/api/v1/groups/{group.id}/schedules", json=payload)

        assert response.status_code == 401


@pytest.mark.api
@pytest.mark.schedules
class TestScheduleList:
    """
    수업 일정 목록 조회 테스트
    GET /api/v1/groups/{group_id}/schedules
    """

    def test_list_schedules_success(self, client: TestClient, test_teacher, teacher_auth_headers, db_session):
        """
        그룹의 일정 목록 조회 성공
        """
        # Create test group
        group = Group(
            name="영어 그룹",
            subject="영어",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create schedules
        schedule1 = Schedule(
            group_id=group.id,
            title="영어 문법",
            start_at=datetime.utcnow() + timedelta(days=1),
            end_at=datetime.utcnow() + timedelta(days=1, hours=1),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        schedule2 = Schedule(
            group_id=group.id,
            title="영어 독해",
            start_at=datetime.utcnow() + timedelta(days=2),
            end_at=datetime.utcnow() + timedelta(days=2, hours=1),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        db_session.add_all([schedule1, schedule2])
        db_session.commit()

        response = client.get(f"/api/v1/groups/{group.id}/schedules", headers=teacher_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_list_schedules_empty(self, client: TestClient, test_teacher, teacher_auth_headers, db_session):
        """
        일정이 없는 그룹 조회 (빈 배열)
        """
        # Create test group without schedules
        group = Group(
            name="과학 그룹",
            subject="과학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        response = client.get(f"/api/v1/groups/{group.id}/schedules", headers=teacher_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


@pytest.mark.api
@pytest.mark.schedules
class TestScheduleUpdate:
    """
    수업 일정 수정 테스트
    PUT /api/v1/schedules/{schedule_id}
    """

    def test_update_schedule_success(self, client: TestClient, test_teacher, teacher_auth_headers, db_session):
        """
        일정 수정 성공
        """
        # Create test group and schedule
        group = Group(
            name="수학 그룹",
            subject="수학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        schedule = Schedule(
            group_id=group.id,
            title="수학 수업",
            start_at=datetime.utcnow() + timedelta(days=1),
            end_at=datetime.utcnow() + timedelta(days=1, hours=1),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        db_session.add(schedule)
        db_session.commit()
        db_session.refresh(schedule)

        # Update payload
        payload = {
            "title": "수학 수업 (수정됨)",
            "location": "오프라인 (강남센터)"
        }

        response = client.put(
            f"/api/v1/schedules/{schedule.id}",
            json=payload,
            headers=teacher_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "수학 수업 (수정됨)"
        assert data["location"] == "오프라인 (강남센터)"
