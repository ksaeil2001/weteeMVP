"""
Settlements Router - F-006 수업료 정산
API_명세서.md 6.6 F-006 기반 정산/청구 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceUpdateRequest,
    InvoiceDetailResponse,
    InvoiceBasicInfo,
    InvoiceListResponse,
    SettlementSummaryResponse,
    PaymentCreateRequest,
    PaymentResponse,
)
from app.services.settlement_service import SettlementService

router = APIRouter(prefix="/settlements", tags=["settlements"])
invoices_router = APIRouter(prefix="/invoices", tags=["invoices"])


# ==========================
# 정산 요약
# ==========================

@router.get("/groups/{group_id}/summary", response_model=SettlementSummaryResponse)
def get_group_monthly_settlement_summary(
    group_id: str = Path(..., description="그룹 ID"),
    year: int = Query(..., ge=2020, le=2100, description="정산 연도"),
    month: int = Query(..., ge=1, le=12, description="정산 월"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 월간 정산 요약

    GET /api/v1/settlements/groups/{group_id}/summary?year=YYYY&month=MM

    **기능**:
    - 특정 그룹의 특정 월 정산 요약 조회
    - 학생별 실제 진행 수업 횟수, 청구 금액 등 계산
    - TEACHER만 가능

    **권한**: TEACHER만 (그룹 소유자)

    **Query Parameters**:
    - year: 정산 연도 (예: 2025)
    - month: 정산 월 (1-12)

    **Response**:
    - SettlementSummaryResponse: 학생별 정산 요약

    Related: F-006, API_명세서.md 6.6
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "정산 요약은 선생님만 조회할 수 있습니다."}
            )

        result = SettlementService.get_group_monthly_settlement_summary(
            db=db,
            user=current_user,
            group_id=group_id,
            year=year,
            month=month
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error getting settlement summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SETTLEMENT001",
                "message": "정산 요약 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 생성
# ==========================

@router.post("/groups/{group_id}/invoices", response_model=InvoiceDetailResponse, status_code=status.HTTP_201_CREATED)
def create_invoice_for_student(
    group_id: str = Path(..., description="그룹 ID"),
    payload: InvoiceCreateRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    특정 학생 청구서 생성/갱신

    POST /api/v1/settlements/groups/{group_id}/invoices

    **기능**:
    - 특정 그룹의 특정 학생에 대한 월별 청구서 생성
    - 이미 청구서가 있으면 기존 것을 CANCELED 처리 후 새로 생성
    - TEACHER만 가능

    **권한**: TEACHER만 (그룹 소유자)

    **Request Body**:
    - year: 정산 연도
    - month: 정산 월 (1-12)
    - student_id: 학생 ID
    - billing_type: 청구 방식 (PREPAID/POSTPAID)

    **Response**:
    - InvoiceDetailResponse: 생성된 청구서 상세

    **Business Logic**:
    - 청구서 번호: TUT-YYYY-NNN (자동 생성)
    - 실제 진행 수업 횟수 기반으로 금액 계산
    - 최소 청구 금액(10,000원) 미만이면 에러

    Related: F-006, API_명세서.md 6.6.1
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 생성할 수 있습니다."}
            )

        result = SettlementService.create_or_update_invoice_for_period(
            db=db,
            user=current_user,
            group_id=group_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error creating invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE001",
                "message": "청구서 생성 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 상세 조회
# ==========================

@invoices_router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice_detail(
    invoice_id: str = Path(..., description="청구서 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 상세 조회

    GET /api/v1/invoices/{invoice_id}

    **기능**:
    - 특정 청구서의 상세 정보 조회

    **권한**:
    - TEACHER: 자신이 발행한 청구서만
    - 학부모/학생: 본인 관련 청구서만

    **Response**:
    - InvoiceDetailResponse: 청구서 상세

    Related: F-006, API_명세서.md 6.6
    """
    try:
        result = SettlementService.get_invoice_detail(
            db=db,
            user=current_user,
            invoice_id=invoice_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error getting invoice detail: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE002",
                "message": "청구서 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 그룹별 청구서 목록 조회
# ==========================

@router.get("/groups/{group_id}/invoices", response_model=InvoiceListResponse)
def list_group_invoices(
    group_id: str = Path(..., description="그룹 ID"),
    year: Optional[int] = Query(None, ge=2020, le=2100, description="필터: 연도"),
    month: Optional[int] = Query(None, ge=1, le=12, description="필터: 월"),
    status: Optional[str] = Query(None, description="필터: 상태 (DRAFT/SENT/PAID/...)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹별 청구서 목록 조회

    GET /api/v1/settlements/groups/{group_id}/invoices?year=YYYY&month=MM&status=PAID&page=1&size=20

    **기능**:
    - 특정 그룹의 청구서 목록 조회 (필터링, 페이징)

    **권한**:
    - TEACHER: 자신이 소유한 그룹의 청구서만
    - 학부모/학생: 본인 관련 청구서만

    **Query Parameters**:
    - year: 필터 - 연도 (선택)
    - month: 필터 - 월 (선택)
    - status: 필터 - 상태 (선택)
    - page: 페이지 번호 (기본: 1)
    - size: 페이지 크기 (기본: 20, 최대: 100)

    **Response**:
    - InvoiceListResponse: 청구서 목록 + 페이징 정보

    Related: F-006, API_명세서.md 6.6.4
    """
    try:
        result = SettlementService.list_group_invoices(
            db=db,
            user=current_user,
            group_id=group_id,
            year=year,
            month=month,
            status=status,
            page=page,
            size=size
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error listing invoices: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE003",
                "message": "청구서 목록 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 수동 결제 확인
# ==========================

@invoices_router.post("/{invoice_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_manual_payment(
    invoice_id: str = Path(..., description="청구서 ID"),
    payload: PaymentCreateRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수동 결제 확인 (현금 등)

    POST /api/v1/invoices/{invoice_id}/payments

    **기능**:
    - 현금 수령 등 수동 결제 확인
    - TEACHER만 가능

    **권한**: TEACHER만

    **Request Body**:
    - method: 결제 수단 (CASH 등)
    - amount: 결제 금액 (원)
    - memo: 결제 메모 (선택)

    **Response**:
    - PaymentResponse: 결제 정보

    Related: F-006
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "결제 확인은 선생님만 할 수 있습니다."}
            )

        result = SettlementService.mark_invoice_paid(
            db=db,
            user=current_user,
            invoice_id=invoice_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error creating payment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PAYMENT001",
                "message": "결제 처리 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 발송
# ==========================

@invoices_router.post("/{invoice_id}/send", response_model=InvoiceDetailResponse)
def send_invoice(
    invoice_id: str = Path(..., description="청구서 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 발송 (학부모에게 알림)

    POST /api/v1/invoices/{invoice_id}/send

    **기능**:
    - 청구서 상태를 DRAFT → SENT로 변경
    - 학부모/학생에게 F-008 알림 발송
    - TEACHER만 가능

    **권한**: TEACHER만

    **Response**:
    - InvoiceDetailResponse: 발송된 청구서 상세

    Related: F-006, F-008
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 발송할 수 있습니다."}
            )

        result = SettlementService.send_invoice(
            db=db,
            user=current_user,
            invoice_id=invoice_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error sending invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE004",
                "message": "청구서 발송 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 취소
# ==========================

@invoices_router.post("/{invoice_id}/cancel", response_model=InvoiceDetailResponse)
def cancel_invoice(
    invoice_id: str = Path(..., description="청구서 ID"),
    reason: Optional[str] = Query(None, description="취소 사유"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 취소

    POST /api/v1/invoices/{invoice_id}/cancel

    **기능**:
    - 청구서 상태를 CANCELED로 변경
    - DRAFT 또는 SENT 상태에서만 취소 가능
    - TEACHER만 가능

    **권한**: TEACHER만

    **Query Parameters**:
    - reason: 취소 사유 (선택)

    **Response**:
    - InvoiceDetailResponse: 취소된 청구서 상세

    Related: F-006
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 취소할 수 있습니다."}
            )

        result = SettlementService.cancel_invoice(
            db=db,
            user=current_user,
            invoice_id=invoice_id,
            reason=reason
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error canceling invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE005",
                "message": "청구서 취소 중 오류가 발생했습니다.",
            },
        )


# ==========================
# PG Webhook (토스페이먼츠 등)
# ==========================

# TODO(v2): 실제 토스페이먼츠 연동 시 구현
payments_router = APIRouter(prefix="/payments", tags=["payments"])


@payments_router.post("/toss/webhook")
async def handle_toss_webhook(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    토스페이먼츠 Webhook 핸들러 (골격)

    POST /api/v1/payments/toss/webhook

    **기능**:
    - 토스페이먼츠에서 결제 상태 변경 시 호출되는 웹훅
    - 결제 승인, 취소, 실패 등의 이벤트 처리

    **Request Body**:
    - 토스페이먼츠 웹훅 페이로드 (JSON)

    **Response**:
    - 성공 메시지

    **TODO**:
    - 토스페이먼츠 API 키 검증
    - 결제 상태별 처리 로직 구현
    - Invoice 상태 업데이트
    - Payment 레코드 업데이트
    - Transaction 기록
    - 알림 발송

    Related: F-006 (시나리오 2), 토스페이먼츠 API 문서
    """
    try:
        # TODO: 웹훅 서명 검증 (보안)
        # signature = request.headers.get("toss-signature")
        # if not verify_toss_signature(signature, request.body):
        #     raise HTTPException(status_code=401, detail="Invalid signature")

        # TODO: 이벤트 타입별 처리
        event_type = request.get("eventType")  # 예: "PAYMENT_SUCCESS", "PAYMENT_CANCELED"
        payment_key = request.get("paymentKey")
        order_id = request.get("orderId")
        amount = request.get("amount")

        print(f"📥 Toss Webhook Received:")
        print(f"  - Event Type: {event_type}")
        print(f"  - Payment Key: {payment_key}")
        print(f"  - Order ID: {order_id}")
        print(f"  - Amount: {amount}")

        # TODO: Payment 레코드 조회 및 업데이트
        # payment = db.query(Payment).filter(
        #     Payment.provider_payment_key == payment_key
        # ).first()
        #
        # if not payment:
        #     raise HTTPException(404, detail="Payment not found")
        #
        # if event_type == "PAYMENT_SUCCESS":
        #     payment.status = PaymentStatus.SUCCESS
        #     payment.approved_at = datetime.utcnow()
        #
        #     # Invoice 상태 업데이트
        #     invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        #     if invoice:
        #         invoice.amount_paid += payment.amount
        #         if invoice.amount_paid >= invoice.amount_due:
        #             invoice.status = InvoiceStatus.PAID
        #             invoice.paid_at = datetime.utcnow()
        #
        #     # 알림 발송 (F-008)
        #     # ...
        #
        # elif event_type == "PAYMENT_CANCELED":
        #     payment.status = PaymentStatus.CANCELED
        #     payment.canceled_at = datetime.utcnow()
        #     # ...
        #
        # db.commit()

        return {
            "success": True,
            "message": "Webhook received (not implemented yet)"
        }

    except Exception as e:
        print(f"🔥 Error processing Toss webhook: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "WEBHOOK001",
                "message": "웹훅 처리 중 오류가 발생했습니다.",
            },
        )
