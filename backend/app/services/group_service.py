"""
Group Service - F-002 과외 그룹 생성 및 매칭 비즈니스 로직
그룹 CRUD 및 멤버 관리 로직
"""

from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.models.group import Group, GroupMember, GroupStatus, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupOut,
    GroupMemberOut,
    GroupListResponse,
    PaginationInfo,
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

        # 멤버 목록 조회
        members = (
            db.query(GroupMember)
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
