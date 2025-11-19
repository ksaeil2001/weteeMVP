"""
Group Service - F-002 과외 그룹 생성 및 매칭 비즈니스 로직
그룹 CRUD 및 멤버 관리 로직
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_
import random
import string

from app.models.group import Group, GroupMember, InviteCode, GroupStatus, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupOut,
    GroupMemberOut,
    GroupListResponse,
    PaginationInfo,
    InviteCodeCreate,
    InviteCodeOut,
)


class GroupService:
    """
    그룹 서비스 레이어
    """

    @staticmethod
    def get_groups_for_user(
        db: Session,
        user: User,
        page: int = 1,
        size: int = 20,
        role_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> GroupListResponse:
        """
        현재 로그인한 사용자가 속한 그룹 목록 조회 (페이지네이션)

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            page: 페이지 번호 (1부터 시작)
            size: 페이지 크기
            role_filter: 역할 필터 (TEACHER/STUDENT/PARENT) - optional
            status_filter: 상태 필터 (ACTIVE/INACTIVE/ARCHIVED) - optional

        Returns:
            GroupListResponse: 그룹 목록, 페이지네이션 정보
        """
        # 사용자가 멤버인 그룹 ID 목록 조회
        member_query = db.query(GroupMember.group_id).filter(
            GroupMember.user_id == user.id,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        )

        # 역할 필터 적용
        if role_filter:
            member_query = member_query.filter(GroupMember.role == role_filter)

        group_ids = [row[0] for row in member_query.all()]

        # 그룹 조회
        query = db.query(Group).filter(Group.id.in_(group_ids))

        # 상태 필터 적용
        if status_filter:
            query = query.filter(Group.status == status_filter)

        # 전체 개수 계산
        total = query.count()

        # 페이지네이션
        offset = (page - 1) * size
        groups = query.order_by(desc(Group.created_at)).offset(offset).limit(size).all()

        # 페이지네이션 정보
        total_pages = (total + size - 1) // size  # 올림 계산
        pagination = PaginationInfo(
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        # 응답 변환 (멤버 수 포함)
        group_items = []
        for group in groups:
            member_count = (
                db.query(func.count(GroupMember.id))
                .filter(
                    GroupMember.group_id == group.id,
                    GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
                )
                .scalar()
            )

            group_out = GroupService._to_group_out(group)
            group_out.member_count = member_count
            group_items.append(group_out)

        return GroupListResponse(
            items=group_items,
            pagination=pagination,
        )

    @staticmethod
    def create_group(
        db: Session,
        owner: User,
        group_create: GroupCreate,
    ) -> GroupOut:
        """
        새 그룹 생성 (선생님만 가능)

        Args:
            db: 데이터베이스 세션
            owner: 그룹을 생성하는 사용자 (선생님)
            group_create: 그룹 생성 요청 데이터

        Returns:
            GroupOut: 생성된 그룹 정보
        """
        # 새 그룹 생성
        new_group = Group(
            name=group_create.name,
            subject=group_create.subject,
            description=group_create.description,
            owner_id=owner.id,
            lesson_fee=group_create.lesson_fee,
            payment_type=group_create.payment_type,
            payment_cycle=group_create.payment_cycle,
            status=GroupStatus.ACTIVE,
        )

        db.add(new_group)
        db.flush()  # ID 생성을 위해 flush

        # 그룹 생성자를 TEACHER 역할로 멤버에 추가
        owner_member = GroupMember(
            group_id=new_group.id,
            user_id=owner.id,
            role=GroupMemberRole.TEACHER,
            invite_status=GroupMemberInviteStatus.ACCEPTED,
        )

        db.add(owner_member)
        db.commit()
        db.refresh(new_group)

        return GroupService._to_group_out(new_group)

    @staticmethod
    def get_group_detail(
        db: Session,
        user: User,
        group_id: str,
    ) -> Optional[GroupOut]:
        """
        그룹 상세 조회 (사용자가 멤버인 그룹만)

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            group_id: 그룹 ID

        Returns:
            GroupOut: 그룹 상세 정보 (멤버 목록 포함)
            None: 그룹이 없거나 권한 없음
        """
        # 그룹 조회
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            return None

        # 사용자가 해당 그룹의 멤버인지 확인
        is_member = (
            db.query(GroupMember)
            .filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            )
            .first()
        )

        if not is_member:
            return None

        # 멤버 목록 조회 (N+1 최적화: user 정보 함께 로드)
        members = (
            db.query(GroupMember)
            .options(joinedload(GroupMember.user))
            .filter(
                GroupMember.group_id == group_id,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            )
            .all()
        )

        # 그룹 응답 생성 (멤버 목록 포함)
        group_out = GroupService._to_group_out(group)
        group_out.members = [GroupService._to_group_member_out(member) for member in members]

        return group_out

    @staticmethod
    def update_group(
        db: Session,
        owner: User,
        group_id: str,
        group_update: GroupUpdate,
    ) -> Optional[GroupOut]:
        """
        그룹 정보 수정 (그룹 소유자만 가능)

        Args:
            db: 데이터베이스 세션
            owner: 현재 로그인한 사용자
            group_id: 그룹 ID
            group_update: 수정할 데이터

        Returns:
            GroupOut: 수정된 그룹 정보
            None: 그룹이 없거나 권한 없음
        """
        # 그룹 조회
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            return None

        # 소유자 확인
        if group.owner_id != owner.id:
            return None

        # 필드 업데이트 (Pydantic exclude_unset 사용)
        update_data = group_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(group, field, value)

        group.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(group)

        return GroupService._to_group_out(group)

    @staticmethod
    def delete_group(
        db: Session,
        owner: User,
        group_id: str,
    ) -> bool:
        """
        그룹 삭제 (그룹 소유자만 가능)

        Args:
            db: 데이터베이스 세션
            owner: 현재 로그인한 사용자
            group_id: 그룹 ID

        Returns:
            bool: 삭제 성공 여부
        """
        # 그룹 조회
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            return False

        # 소유자 확인
        if group.owner_id != owner.id:
            return False

        # 그룹 삭제 (cascade로 멤버도 자동 삭제)
        db.delete(group)
        db.commit()

        return True

    # ==========================
    # Helper Methods
    # ==========================

    @staticmethod
    def _to_group_out(group: Group) -> GroupOut:
        """
        Group 모델을 GroupOut 스키마로 변환

        Args:
            group: Group 모델 인스턴스

        Returns:
            GroupOut: Pydantic 스키마
        """
        return GroupOut(
            group_id=group.id,
            name=group.name,
            subject=group.subject,
            description=group.description,
            owner_id=group.owner_id,
            status=group.status.value,
            created_at=group.created_at.isoformat() + "Z" if group.created_at else None,
            updated_at=group.updated_at.isoformat() + "Z" if group.updated_at else None,
        )

    @staticmethod
    def _to_group_member_out(member: GroupMember) -> GroupMemberOut:
        """
        GroupMember 모델을 GroupMemberOut 스키마로 변환

        Args:
            member: GroupMember 모델 인스턴스

        Returns:
            GroupMemberOut: Pydantic 스키마
        """
        return GroupMemberOut(
            member_id=member.id,
            user_id=member.user_id,
            role=member.role.value,
            invite_status=member.invite_status.value,
            joined_at=member.joined_at.isoformat() + "Z" if member.joined_at else None,
        )

    # ==========================
    # Invite Code Management - F-002
    # ==========================

    @staticmethod
    def _generate_unique_code(db: Session, max_attempts: int = 3) -> Optional[str]:
        """
        고유한 6자리 코드 생성
        F-002 비즈니스 규칙: 6자리 알파벳 대문자 + 숫자

        Args:
            db: 데이터베이스 세션
            max_attempts: 최대 재시도 횟수

        Returns:
            str: 생성된 코드
            None: 생성 실패
        """
        chars = string.ascii_uppercase + string.digits  # A-Z + 0-9
        for _ in range(max_attempts):
            code = ''.join(random.choices(chars, k=6))
            # 중복 확인
            existing = db.query(InviteCode).filter(InviteCode.code == code).first()
            if not existing:
                return code
        return None

    @staticmethod
    def create_invite_code(
        db: Session,
        creator: User,
        group_id: str,
        invite_code_create: InviteCodeCreate,
    ) -> Optional[InviteCodeOut]:
        """
        초대 코드 생성 (선생님만 가능)

        F-002 비즈니스 규칙:
        - 형식: 6자리 알파벳 대문자 + 숫자
        - 유효 기간: 생성 후 7일 (기본값, 커스터마이징 가능)
        - 사용 횟수: 기본 1회 (커스터마이징 가능)
        - 역할 구분: STUDENT 또는 PARENT

        Args:
            db: 데이터베이스 세션
            creator: 초대 코드를 생성하는 사용자 (선생님)
            group_id: 그룹 ID
            invite_code_create: 초대 코드 생성 요청 데이터

        Returns:
            InviteCodeOut: 생성된 초대 코드 정보
            None: 생성 실패
        """
        # 그룹 존재 여부 확인
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            return None

        # 선생님 권한 확인 (그룹 소유자)
        if group.owner_id != creator.id:
            return None

        # 대기 중인 초대 개수 확인 (스팸 방지)
        pending_count = db.query(func.count(InviteCode.id)).filter(
            InviteCode.group_id == group_id,
            InviteCode.is_active == True,
        ).scalar()

        if pending_count >= 10:  # F-002: 그룹당 최대 10개 대기 중 초대
            return None

        # 코드 생성
        code = GroupService._generate_unique_code(db)
        if not code:
            return None

        # expires_in_days 처리 (기본값 7일)
        expires_in_days = invite_code_create.expires_in_days or 7
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        # 초대 코드 생성
        new_invite_code = InviteCode(
            code=code,
            group_id=group_id,
            created_by=creator.id,
            target_role=invite_code_create.target_role,
            max_uses=invite_code_create.max_uses or 1,
            used_count=0,
            expires_at=expires_at,
            is_active=True,
        )

        db.add(new_invite_code)
        db.commit()
        db.refresh(new_invite_code)

        return GroupService._to_invite_code_out(new_invite_code)

    @staticmethod
    def get_invite_codes_for_group(
        db: Session,
        requester: User,
        group_id: str,
    ) -> Optional[List[InviteCodeOut]]:
        """
        그룹의 초대 코드 목록 조회 (그룹 소유자만 가능)

        Args:
            db: 데이터베이스 세션
            requester: 요청하는 사용자 (선생님)
            group_id: 그룹 ID

        Returns:
            List[InviteCodeOut]: 초대 코드 목록
            None: 권한 없음
        """
        # 그룹 존재 여부 확인
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            return None

        # 선생님 권한 확인 (그룹 소유자)
        if group.owner_id != requester.id:
            return None

        # 초대 코드 목록 조회
        invite_codes = (
            db.query(InviteCode)
            .filter(InviteCode.group_id == group_id)
            .order_by(desc(InviteCode.created_at))
            .all()
        )

        return [GroupService._to_invite_code_out(ic) for ic in invite_codes]

    @staticmethod
    def join_group_with_code(
        db: Session,
        user: User,
        code: str,
    ) -> Tuple[Optional[Group], Optional[GroupMember], Optional[str]]:
        """
        초대 코드로 그룹에 가입

        F-002 비즈니스 규칙:
        - 코드의 유효성 확인 (존재, 미만료, 사용 가능)
        - 사용자의 역할과 코드의 target_role 일치 확인
        - 그룹 멤버로 자동 추가
        - 사용 횟수 증가
        - 최대 사용 횟수 도달 시 비활성화

        Args:
            db: 데이터베이스 세션
            user: 그룹에 가입하려는 사용자
            code: 초대 코드

        Returns:
            Tuple[Group, GroupMember, None]: 성공 (그룹, 멤버, None)
            Tuple[None, None, str]: 실패 (None, None, 에러 메시지)
        """
        # 초대 코드 확인
        invite_code = db.query(InviteCode).filter(InviteCode.code == code).first()
        if not invite_code:
            return None, None, "초대 코드를 확인해주세요"

        # 코드 유효성 확인
        if not invite_code.is_available():
            if invite_code.is_expired():
                return None, None, "초대 코드가 만료되었습니다. 선생님께 새 코드를 요청해주세요"
            else:
                return None, None, "이미 사용된 초대 코드입니다. 선생님께 새 코드를 요청해주세요"

        # 사용자 역할과 코드 역할 일치 확인 (대소문자 무시)
        if user.role.value.upper() != invite_code.target_role.value.upper():
            return None, None, f"이 코드는 {invite_code.target_role.value} 전용입니다. 역할을 다시 선택해주세요"

        # 그룹 조회
        group = db.query(Group).filter(Group.id == invite_code.group_id).first()
        if not group:
            return None, None, "그룹을 찾을 수 없습니다"

        # 이미 같은 그룹의 멤버인지 확인
        existing_member = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == user.id,
        ).first()

        if existing_member:
            return None, None, "이미 이 그룹에 참여하고 있습니다"

        # 그룹 멤버 추가
        new_member = GroupMember(
            group_id=group.id,
            user_id=user.id,
            role=invite_code.target_role,
            invite_status=GroupMemberInviteStatus.ACCEPTED,
        )

        db.add(new_member)

        # 초대 코드 사용 횟수 증가
        invite_code.increment_usage()

        db.commit()
        db.refresh(new_member)

        return group, new_member, None

    @staticmethod
    def _to_invite_code_out(invite_code: InviteCode) -> InviteCodeOut:
        """
        InviteCode 모델을 InviteCodeOut 스키마로 변환

        Args:
            invite_code: InviteCode 모델 인스턴스

        Returns:
            InviteCodeOut: Pydantic 스키마
        """
        return InviteCodeOut(
            invite_code_id=invite_code.id,
            code=invite_code.code,
            group_id=invite_code.group_id,
            target_role=invite_code.target_role.value,  # role → target_role
            created_by=invite_code.created_by,
            expires_at=invite_code.expires_at.isoformat() + "Z" if invite_code.expires_at else None,
            max_uses=invite_code.max_uses,
            used_count=invite_code.used_count,  # current_uses → used_count
            is_active=invite_code.is_active,
            created_at=invite_code.created_at.isoformat() + "Z" if invite_code.created_at else None,  # 추가
        )
