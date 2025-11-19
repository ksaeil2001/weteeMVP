"""
N+1 쿼리 최적화 테스트 스크립트

이 스크립트는 joinedload 최적화가 적용된 서비스 메서드들의 쿼리 개수를 확인합니다.

실행 방법:
    cd /home/user/weteeMVP/backend
    python test_n_plus_one.py

주의:
    - 이 스크립트는 개발용 SQLite DB를 사용합니다
    - 실제 데이터가 필요하므로, DB에 테스트 데이터가 있어야 합니다
"""

import sys
from sqlalchemy import event
from sqlalchemy.engine import Engine
from app.database import SessionLocal, engine
from app.models.user import User
from app.services.group_service import GroupService
from app.services.schedule_service import ScheduleService
from app.services.lesson_service import LessonService

# 쿼리 카운터
query_count = 0


@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    """각 SQL 쿼리가 실행되기 전에 호출되는 리스너"""
    global query_count
    query_count += 1
    # 쿼리 출력 (디버깅용)
    # print(f"Query #{query_count}: {statement[:100]}...")


def reset_counter():
    """쿼리 카운터 리셋"""
    global query_count
    query_count = 0
    return 0


def get_count():
    """현재 쿼리 개수 반환"""
    global query_count
    return query_count


def test_group_service():
    """GroupService.get_group_detail 테스트"""
    print("\n" + "="*60)
    print("TEST: GroupService.get_group_detail (N+1 최적화)")
    print("="*60)

    db = SessionLocal()
    try:
        # 테스트용 사용자 조회
        user = db.query(User).filter(User.email == "teacher@example.com").first()
        if not user:
            print("❌ 테스트 사용자(teacher@example.com)가 없습니다.")
            return

        # 사용자가 속한 그룹 목록 조회
        groups_response = GroupService.get_groups_for_user(db, user, page=1, size=10)
        if not groups_response.items:
            print("❌ 사용자가 속한 그룹이 없습니다.")
            return

        group_id = groups_response.items[0].group_id

        # 쿼리 카운터 리셋
        reset_counter()

        # 그룹 상세 조회 (멤버 목록 포함)
        group_detail = GroupService.get_group_detail(db, user, group_id)

        queries = get_count()
        member_count = len(group_detail.members) if group_detail.members else 0

        print(f"✅ 그룹 ID: {group_id}")
        print(f"✅ 멤버 수: {member_count}명")
        print(f"✅ 총 쿼리 개수: {queries}")

        # 기대값: joinedload 사용 시 1-2개의 쿼리로 해결 가능
        # (Group 조회 + GroupMember with User joinedload)
        if queries <= 3:
            print(f"✅ N+1 최적화 성공! (예상: 1-3개, 실제: {queries}개)")
        else:
            print(f"⚠️ 최적화가 필요할 수 있습니다. (실제: {queries}개)")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def test_schedule_service():
    """ScheduleService.get_schedules 테스트"""
    print("\n" + "="*60)
    print("TEST: ScheduleService.get_schedules (N+1 최적화)")
    print("="*60)

    db = SessionLocal()
    try:
        # 테스트용 사용자 조회
        user = db.query(User).filter(User.email == "teacher@example.com").first()
        if not user:
            print("❌ 테스트 사용자(teacher@example.com)가 없습니다.")
            return

        # 쿼리 카운터 리셋
        reset_counter()

        # 일정 목록 조회 (attendances, lesson_record 포함)
        schedules_response = ScheduleService.get_schedules(
            db, user, page=1, size=10
        )

        queries = get_count()
        schedule_count = len(schedules_response.items)

        print(f"✅ 일정 수: {schedule_count}개")
        print(f"✅ 총 쿼리 개수: {queries}")

        # 기대값: joinedload 사용 시 N+1 없이 일정 조회 가능
        # (Schedule with lesson_record, attendances joinedload)
        if queries <= 5:
            print(f"✅ N+1 최적화 성공! (예상: 2-5개, 실제: {queries}개)")
        else:
            print(f"⚠️ 최적화가 필요할 수 있습니다. (실제: {queries}개)")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def test_lesson_service():
    """LessonService.get_lesson_record 테스트"""
    print("\n" + "="*60)
    print("TEST: LessonService.get_lesson_record (N+1 최적화)")
    print("="*60)

    db = SessionLocal()
    try:
        # 테스트용 사용자 조회
        user = db.query(User).filter(User.email == "teacher@example.com").first()
        if not user:
            print("❌ 테스트 사용자(teacher@example.com)가 없습니다.")
            return

        # 수업 기록 조회 (임시로 첫 번째 수업 기록 사용)
        from app.models.lesson import LessonRecord
        lesson_record = db.query(LessonRecord).first()
        if not lesson_record:
            print("❌ 수업 기록이 없습니다.")
            return

        # 쿼리 카운터 리셋
        reset_counter()

        # 수업 기록 상세 조회 (progress_records, textbook 포함)
        lesson_detail = LessonService.get_lesson_record(db, user, lesson_record.id)

        queries = get_count()
        progress_count = len(lesson_detail.progress_records) if lesson_detail.progress_records else 0

        print(f"✅ 수업 기록 ID: {lesson_record.id}")
        print(f"✅ 진도 기록 수: {progress_count}개")
        print(f"✅ 총 쿼리 개수: {queries}")

        # 기대값: joinedload 사용 시 N+1 없이 조회 가능
        # (LessonRecord with progress_records.textbook joinedload)
        # 진도 기록 개수와 무관하게 일정한 쿼리 수
        if queries <= 5:
            print(f"✅ N+1 최적화 성공! (예상: 2-5개, 실제: {queries}개)")
        else:
            print(f"⚠️ 최적화가 필요할 수 있습니다. (실제: {queries}개)")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def main():
    """메인 테스트 실행"""
    print("\n" + "="*60)
    print("WeTee MVP - N+1 쿼리 최적화 테스트")
    print("="*60)
    print("SQLAlchemy joinedload를 사용한 N+1 쿼리 최적화를 검증합니다.\n")

    # 각 서비스별 테스트 실행
    test_group_service()
    test_schedule_service()
    test_lesson_service()

    print("\n" + "="*60)
    print("테스트 완료!")
    print("="*60)
    print("\n💡 TIP: 쿼리 개수가 데이터 개수와 무관하게 일정하면 N+1 최적화 성공입니다.")
    print("💡 TIP: 자세한 쿼리 내용을 보려면 스크립트의 주석을 해제하세요.\n")


if __name__ == "__main__":
    main()
