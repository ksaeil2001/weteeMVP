# F-006 토스페이먼츠 Webhook 구현 완료 보고서

**작성일**: 2025-11-18
**작성자**: Claude Code
**상태**: ✅ 구현 완료
**관련 기능**: F-006 (수업료 정산)

---

## 📋 요약

F-006 수업료 정산 기능의 **핵심 부분인 토스페이먼츠 Webhook 처리**를 완전히 구현했습니다.

**주요 완료 항목:**
- ✅ Webhook 서명 검증 (HMAC-SHA256) 구현
- ✅ 이벤트 타입별 처리 (PAYMENT_COMPLETED, PAYMENT_CANCELED, PAYMENT_FAILED)
- ✅ Payment/Invoice 상태 업데이트 로직
- ✅ 알림 서비스 통합 (F-008)
- ✅ 종합적인 에러 처리 및 로깅
- ✅ 구성 설정 추가

---

## 🔧 구현 내용

### 1. Webhook 서명 검증 함수 추가
**파일**: `backend/app/core/security.py`

```python
def verify_toss_signature(
    signature: str,
    payment_key: str,
    order_id: str,
    amount: int,
    secret_key: str
) -> bool
```

**기능**:
- 토스페이먼츠 Webhook의 X-Toss-Signature 헤더 검증
- HMAC-SHA256 기반 서명 생성 및 비교
- Timing Attack 방지 (hmac.compare_digest 사용)

**구현 방식**:
```
메시지 = "{paymentKey},{orderId},{amount}"
서명 = Base64(HMAC-SHA256(메시지, secretKey))
검증 = 비교(받은서명, 생성서명)
```

### 2. Webhook 핸들러 완전 구현
**파일**: `backend/app/routers/settlements.py`
**엔드포인트**: `POST /api/v1/payments/toss/webhook`

#### 처리 플로우 (9단계)

```
1️⃣ 요청 본문 파싱 (JSON)
   ├─ eventType 추출
   ├─ data (paymentKey, orderId, amount 등) 추출
   └─ 오류 시 400 Bad Request 반환

2️⃣ Webhook 서명 검증 (X-Toss-Signature)
   ├─ 서명 없음 → 개발환경은 스킵, 운영환경은 401 반환
   ├─ 서명 검증 실패 → 401 Unauthorized 반환
   └─ 성공 → 다음 단계 진행

3️⃣ 필수 필드 확인
   ├─ payment_key, order_id, amount 필수
   └─ 누락 시 400 Bad Request 반환

4️⃣ Invoice 조회
   ├─ order_id로 Invoice 검색
   ├─ Invoice 미존재 → 200 OK 반환 (토스재전송 방지)
   └─ Invoice 존재 → 다음 단계 진행

5️⃣ 기존 Payment 레코드 확인
   ├─ 중복 처리 방지 (payment_key로 검색)
   └─ 존재 여부 판단

6️⃣ 이벤트 타입별 처리
   ├─ PAYMENT_COMPLETED
   │  ├─ Payment 레코드 생성 또는 업데이트
   │  ├─ 상태 → SUCCESS, approved_at 설정
   │  ├─ Invoice amount_paid 증가
   │  ├─ amount_paid >= amount_due → Invoice status = PAID
   │  ├─ 아니면 → Invoice status = PARTIALLY_PAID
   │  └─ Card 정보 저장 (보안: 마지막 4자리만)
   │
   ├─ PAYMENT_CANCELED
   │  ├─ Payment 상태 → CANCELED, canceled_at 설정
   │  └─ Invoice 상태는 유지 (선생님이 수동 처리)
   │
   └─ PAYMENT_FAILED
      ├─ Payment 상태 → FAILED
      ├─ failure_reason 저장
      └─ Invoice 상태는 유지

7️⃣ Transaction 기록 (거래 내역)
   ├─ Type: CHARGE (결제)
   ├─ Amount: 결제 금액
   └─ Note: 거래 메모

8️⃣ 알림 발송 (F-008 통합)
   ├─ 선생님: "과외비 결제 완료" 알림
   │  └─ "{invoice_number} ({amount:,}원)이 결제되었습니다."
   ├─ 학부모: (향후 Group 관계를 통해 조회)
   └─ 알림 실패는 무시하고 계속 진행 (중요도: 낮음)

9️⃣ 데이터베이스 커밋
   └─ 모든 변경사항 저장
```

#### 에러 처리

| 상황 | HTTP 코드 | 에러 코드 | 설명 |
|------|---------|----------|------|
| 페이로드 파싱 실패 | 400 | WEBHOOK_PARSE_ERROR | JSON 파싱 실패 |
| 서명 헤더 없음 | 401 (운영환경) | SIGNATURE_MISSING | 서명 없음 |
| 서명 검증 실패 | 401 | SIGNATURE_INVALID | 서명 불일치 |
| 필수 필드 누락 | 400 | MISSING_FIELDS | 필수 정보 누락 |
| 설정 오류 | 500 | CONFIG_ERROR | 시크릿 키 미설정 |
| 기타 오류 | 500 | WEBHOOK_PROCESSING_ERROR | 예상 외 오류 |

#### 로깅

상세한 로깅으로 모든 단계를 추적할 수 있습니다:

```
📥 Toss Webhook Received [ID: {orderId}]
✅ Invoice found: TUT-2025-001
🎉 Payment Completed [ID: ...]
✅ Payment marked as SUCCESS
✅ Invoice marked as PAID
✅ Created Transaction record
📢 Notification sent to teacher
✅ Webhook processed successfully [ID: ...]
```

### 3. Payment 모델 확장 (기존 코드 활용)
**파일**: `backend/app/models/invoice.py`

이미 구현된 Payment 모델의 필드:
- `provider_payment_key`: 토스페이먼츠 결제 키 저장
- `provider`: "toss" 저장
- `provider_order_id`: Invoice ID 저장
- `card_last4`: 카드 마지막 4자리 (보안)
- `card_company`: 카드사 이름
- `approved_at`: 결제 승인 시각
- `canceled_at`: 결제 취소 시각
- `failure_reason`: 실패 사유

### 4. Invoice 모델 확장 (기존 코드 활용)
**파일**: `backend/app/models/invoice.py`

이미 구현된 Invoice 모델의 필드:
- `amount_paid`: 실제 납부된 금액 (Webhook에서 누적)
- `status`: InvoiceStatus 열거형
  - DRAFT → SENT → PAID (또는 PARTIALLY_PAID)
- `paid_at`: 결제 완료 시각
- `transactions`: Transaction 관계 (1:N)

### 5. 설정 추가
**파일**: `backend/app/config.py`

```python
# Payment Gateway (Toss Payments) - F-006
TOSS_PAYMENTS_SECRET_KEY: str = ""  # 환경변수에서 로드
TOSS_PAYMENTS_CLIENT_KEY: str = ""  # 개발용 클라이언트 키
```

**환경변수 설정** (`.env` 파일):
```env
TOSS_PAYMENTS_SECRET_KEY=your_secret_key_here
TOSS_PAYMENTS_CLIENT_KEY=your_client_key_here
```

### 6. 기타 개선사항

#### Imports 추가 (settlements.py)
- `from app.models.invoice import Invoice, InvoiceStatus, Payment, PaymentStatus, Transaction, TransactionType`
- `from app.services.notification_service import NotificationService`
- `from app.core.security import verify_toss_signature`
- `from app.config import settings`
- `import logging`

#### Logger 설정
```python
logger = logging.getLogger(__name__)
```

---

## 📊 API 명세 (API_명세서.md 기준)

### Webhook 엔드포인트

```http
POST /api/v1/payments/toss/webhook
Content-Type: application/json
X-Toss-Signature: <signature>

{
  "eventType": "PAYMENT_COMPLETED",
  "data": {
    "paymentKey": "toss_payment_key_123",
    "orderId": "uuid-invoice-123",
    "amount": 390000,
    "status": "DONE",
    "requestedAt": "2025-12-01T14:30:00Z",
    "approvedAt": "2025-12-01T14:30:05Z"
  }
}
```

**응답**:
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## 🔗 기능 연동

### F-008 알림 시스템과의 연동

결제 완료 시 **선생님에게 자동 알림 발송**:

```python
NotificationService.send_notification(
    db=db,
    user_id=teacher.id,
    notification_type="SETTLEMENT_PAID",
    title="과외비 결제 완료",
    message=f"{invoice.invoice_number} ({amount:,}원)이 결제되었습니다.",
    related_id=invoice.id
)
```

**향후 개선**:
- 학부모에게도 알림 발송 (Group 관계를 통해 조회)
- 다양한 결제 상태 알림 (실패, 취소 등)

---

## 🚀 사용 방법

### 개발 환경

1. **환경변수 설정** (.env):
```env
DEBUG=True
TOSS_PAYMENTS_SECRET_KEY=""  # 빈 문자열 (개발환경에서는 서명 검증 스킵)
```

2. **백엔드 실행**:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

3. **Webhook 테스트** (curl):
```bash
curl -X POST http://localhost:8000/api/v1/payments/toss/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PAYMENT_COMPLETED",
    "data": {
      "paymentKey": "test_payment_key",
      "orderId": "uuid-invoice-123",
      "amount": 50000
    }
  }'
```

### 운영 환경

1. **환경변수 설정** (.env):
```env
DEBUG=False
TOSS_PAYMENTS_SECRET_KEY=your_actual_secret_key
TOSS_PAYMENTS_CLIENT_KEY=your_actual_client_key
```

2. **토스페이먼츠 Webhook URL 등록**:
   - 토스페이먼츠 대시보드에서 Webhook URL 등록
   - URL: `https://your-domain.com/api/v1/payments/toss/webhook`

---

## ⚠️ 주의사항

### 1. 멱등성 (Idempotency)
- 토스페이먼츠가 같은 결제에 대해 여러 번 Webhook 전송할 수 있음
- **구현**: `provider_payment_key`로 기존 Payment 검색, 중복 처리 방지
- **반환**: 중복된 경우 200 OK ("Payment already processed") 반환

### 2. 서명 검증
- **개발 환경**: 서명 검증 스킵 가능 (DEBUG=True)
- **운영 환경**: 반드시 서명 검증 (DEBUG=False) → 401 반환

### 3. 알림 실패 처리
- 알림 발송 실패해도 Webhook 처리는 계속 진행
- 알림 실패는 로그에 경고만 표시

### 4. 시간대
- 모든 시각은 UTC (datetime.utcnow())
- 로그는 서버 시간대 기준

---

## 📝 향후 개선 사항 (TODO)

### v2 계획

1. **학부모 알림 발송** (현재 TODO)
   ```python
   # TODO: Group 관계를 통해 학부모 조회
   parents = db.query(User).join(GroupMember).filter(
       GroupMember.group_id == invoice.group_id,
       GroupMember.role == GroupMemberRole.PARENT
   ).all()
   ```

2. **결제 수단 상세 정보** (현재 "CARD" 고정)
   - 토스페이먼츠 응답에서 method 필드 추가 시 저장

3. **환불 처리 Webhook**
   - PAYMENT_REFUNDED 이벤트 처리 추가
   - Invoice amount_paid 감소, 거래 내역 기록

4. **결제 실패 재시도**
   - 결제 실패 시 학부모에게 재시도 권유 알림
   - 일정 횟수 실패 시 선생님에게 알림

5. **카드 정보 보안 강화**
   - 카드 정보 암호화 저장 (현재는 마지막 4자리만)
   - PCI-DSS 준수

6. **이벤트 로깅 개선**
   - 별도 audit_log 테이블로 모든 결제 이벤트 기록
   - 분쟁 발생 시 내역 확인용

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 결제 완료
**상황**: 학부모가 청구서 결제 완료
**흐름**:
1. 프론트엔드에서 결제 요청
2. 토스페이먼츠에서 결제 승인
3. Webhook 전송 (eventType: PAYMENT_COMPLETED)
4. Invoice status: DRAFT → SENT → PAID
5. 선생님에게 알림 발송

**검증**:
```sql
SELECT * FROM invoices WHERE id = 'uuid-invoice-123';
-- status = 'PAID', amount_paid = 50000, paid_at = now()

SELECT * FROM payments WHERE invoice_id = 'uuid-invoice-123';
-- status = 'SUCCESS', approved_at = now()

SELECT * FROM transactions WHERE invoice_id = 'uuid-invoice-123';
-- type = 'CHARGE', amount = 50000
```

### 시나리오 2: 일부 결제 (분할 결제)
**상황**: 학부모가 50% 먼저 결제, 나중에 나머지 결제
**흐름**:
1. 첫 번째 Webhook → Invoice status = PARTIALLY_PAID, amount_paid = 25000
2. 두 번째 Webhook → Invoice status = PAID, amount_paid = 50000

### 시나리오 3: 결제 취소
**상황**: 학부모가 결제 취소
**흐름**:
1. Webhook 전송 (eventType: PAYMENT_CANCELED)
2. Payment status = CANCELED
3. Invoice status는 유지 (수동 처리 필요)

### 시나리오 4: 결제 실패
**상황**: 카드 한도 초과 등으로 결제 실패
**흐름**:
1. Webhook 전송 (eventType: PAYMENT_FAILED)
2. Payment status = FAILED, failure_reason = "카드 한도 초과"
3. Invoice status는 유지 (미결제 상태)

### 시나리오 5: 중복 Webhook (멱등성)
**상황**: 토스페이먼츠가 같은 결제에 대해 Webhook 2번 전송
**흐름**:
1. 첫 번째 Webhook → 처리 완료, Invoice status = PAID
2. 두 번째 Webhook → "Payment already processed" 반환
3. Invoice 상태 변경 없음

---

## 🔍 디버깅 가이드

### 로그 확인
```bash
# 터미널에서 실시간 로그 확인
tail -f backend.log | grep "Toss Webhook"
```

### Webhook 수신 확인
```bash
# 로그에 다음이 출력되어야 함
📥 Toss Webhook Received [ID: uuid-invoice-123]
✅ Invoice found: TUT-2025-001
✅ Payment marked as SUCCESS
✅ Invoice marked as PAID
✅ Webhook processed successfully
```

### 데이터베이스 확인
```bash
# SQLite 확인 (개발 환경)
cd backend
python3 -c "
import sqlite3
conn = sqlite3.connect('wetee.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM payments WHERE invoice_id = \"uuid-invoice-123\"')
print(cursor.fetchall())
conn.close()
"
```

---

## ✅ 구현 체크리스트

- [x] Webhook 서명 검증 (HMAC-SHA256)
- [x] 요청 본문 파싱
- [x] 이벤트 타입별 처리 (COMPLETED, CANCELED, FAILED)
- [x] Payment 모델 활용
- [x] Invoice 상태 업데이트
- [x] Transaction 기록
- [x] F-008 알림 서비스 통합
- [x] 종합적인 에러 처리
- [x] 로깅 (상세 정보, 경고, 에러)
- [x] 설정 추가 (TOSS_PAYMENTS_SECRET_KEY)
- [x] 중복 처리 방지
- [x] 코드 주석 및 설명

---

## 📞 참고 문서

- **F-006_수업료_정산.md** (기능 명세)
  - 시나리오 2 참조 (학부모가 청구서 확인 및 결제)
  - 이벤트 타입별 처리 로직 근거

- **API_명세서.md** (API 설계)
  - 7.1 토스페이먼츠 결제 완료 WebHook
  - 엔드포인트, 요청/응답 스키마

- **데이터베이스_설계서.md** (DB 구조)
  - Invoice, Payment, Transaction 테이블
  - 관계 정의

- **기술스택_설계서.md** (기술 스택)
  - FastAPI, SQLAlchemy 사용

---

## 📌 결론

F-006 토스페이먼츠 Webhook 구현이 **완전히 완료**되었습니다.

**주요 성과**:
1. ✅ 보안 (HMAC-SHA256 서명 검증)
2. ✅ 안정성 (멱등성, 에러 처리, 로깅)
3. ✅ 기능성 (이벤트 처리, 상태 업데이트, 알림)
4. ✅ 확장성 (향후 학부모 알림, 환불 처리 등)

다음 단계: 프론트엔드 결제 UI와의 연동 테스트, 토스페이먼츠 실제 API 연동

---

**작성 일시**: 2025-11-18
**상태**: ✅ 구현 완료, 테스트 대기 중
