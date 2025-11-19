#!/bin/bash

# ============================================================
# WeTee MVP E2E Test - Teacher Flow
# 선생님 플로우: 완전한 한 달 과외 사이클
# ============================================================

set -e

API_BASE="http://localhost:8000/api/v1"
TEST_DATE=$(date +"%Y-%m-%d")
RESULTS_FILE="/tmp/e2e_teacher_results_${TEST_DATE}.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
declare -A TEST_RESULTS
PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
log_test() {
    echo -e "\n${YELLOW}TEST: $1${NC}"
}

log_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASS_COUNT++))
    TEST_RESULTS["$2"]="PASS"
}

log_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}   Error: $2${NC}"
    ((FAIL_COUNT++))
    TEST_RESULTS["$3"]="FAIL: $2"
}

extract_json() {
    echo "$1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data$2)" 2>/dev/null || echo ""
}

# Variables
TEACHER_EMAIL="teacher_e2e_$(date +%s)@test.com"
TEACHER_PASSWORD="Teacher123!"
TEACHER_TOKEN=""
TEACHER_ID=""
GROUP_ID=""
INVITE_CODE=""
SCHEDULE_ID_1=""
SCHEDULE_ID_2=""
STUDENT_ID=""
ATTENDANCE_ID_1=""
ATTENDANCE_ID_2=""
LESSON_RECORD_ID_1=""
LESSON_RECORD_ID_2=""
TEXTBOOK_ID=""
PROGRESS_RECORD_ID_1=""
PROGRESS_RECORD_ID_2=""
INVOICE_ID=""

echo "============================================================"
echo "🧪 WeTee MVP E2E Test - Teacher Flow"
echo "============================================================"
echo "Teacher Email: $TEACHER_EMAIL"
echo "API Base: $API_BASE"
echo ""

# ============================================================
# Step 1: 회원가입 (선생님, TEACHER 역할)
# ============================================================
log_test "Step 1: 회원가입 (선생님)"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEACHER_EMAIL'",
    "password": "'$TEACHER_PASSWORD'",
    "name": "Test Teacher",
    "phone": "010-1234-5678",
    "role": "TEACHER"
  }')

# Check for both response formats: standard {"success": true} or direct user response
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    log_pass "회원가입 성공 (standard format)" "step1_register"
    TEACHER_ID=$(extract_json "$REGISTER_RESPONSE" "['data']['user']['id']")
    echo "Teacher ID: $TEACHER_ID"
elif echo "$REGISTER_RESPONSE" | grep -q '"user_id"'; then
    log_pass "회원가입 성공 (direct format)" "step1_register"
    TEACHER_ID=$(extract_json "$REGISTER_RESPONSE" "['user_id']")
    echo "Teacher ID: $TEACHER_ID"
else
    log_fail "회원가입 실패" "$REGISTER_RESPONSE" "step1_register"
    exit 1
fi

# ============================================================
# Step 2: 로그인
# ============================================================
log_test "Step 2: 로그인"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEACHER_EMAIL'",
    "password": "'$TEACHER_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    log_pass "로그인 성공" "step2_login"
    TEACHER_TOKEN=$(extract_json "$LOGIN_RESPONSE" "['data']['access_token']")
    echo "Token acquired (first 20 chars): ${TEACHER_TOKEN:0:20}..."
else
    log_fail "로그인 실패" "$LOGIN_RESPONSE" "step2_login"
    exit 1
fi

# ============================================================
# Step 3: 과외 그룹 생성
# ============================================================
log_test "Step 3: 과외 그룹 생성"

GROUP_RESPONSE=$(curl -s -X POST "$API_BASE/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "name": "고등수학 과외",
    "subject": "수학",
    "description": "고등학교 수학 개인 과외",
    "lesson_fee": 100000,
    "payment_type": "per_lesson",
    "payment_cycle": 4
  }')

if echo "$GROUP_RESPONSE" | grep -q '"success":true'; then
    log_pass "그룹 생성 성공" "step3_create_group"
    GROUP_ID=$(extract_json "$GROUP_RESPONSE" "['data']['id']")
    echo "Group ID: $GROUP_ID"
else
    log_fail "그룹 생성 실패" "$GROUP_RESPONSE" "step3_create_group"
    exit 1
fi

# ============================================================
# Step 4: 초대 코드 생성
# ============================================================
log_test "Step 4: 초대 코드 생성"

INVITE_RESPONSE=$(curl -s -X POST "$API_BASE/groups/$GROUP_ID/invite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "target_role": "STUDENT",
    "max_uses": 5,
    "expires_in_hours": 168
  }')

if echo "$INVITE_RESPONSE" | grep -q '"success":true'; then
    log_pass "초대 코드 생성 성공" "step4_create_invite"
    INVITE_CODE=$(extract_json "$INVITE_RESPONSE" "['data']['code']")
    echo "Invite Code: $INVITE_CODE"
else
    log_fail "초대 코드 생성 실패" "$INVITE_RESPONSE" "step4_create_invite"
fi

# ============================================================
# Step 5: 정규 일정 등록 (매주 월/수/금 19:00-21:00)
# ============================================================
log_test "Step 5: 정규 일정 등록"

# 첫 번째 일정
SCHEDULE_1_RESPONSE=$(curl -s -X POST "$API_BASE/schedules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "group_id": "'$GROUP_ID'",
    "title": "정규 수업 - 월요일",
    "type": "regular",
    "start_at": "2025-11-19T19:00:00",
    "end_at": "2025-11-19T21:00:00",
    "status": "confirmed",
    "recurrence_rule": {
      "frequency": "weekly",
      "interval": 1,
      "by_day": ["monday"]
    },
    "location": "강남역 스터디카페",
    "memo": "월요일 정규 수업"
  }')

if echo "$SCHEDULE_1_RESPONSE" | grep -q '"success":true'; then
    log_pass "첫 번째 일정 등록 성공" "step5_schedule_1"
    SCHEDULE_ID_1=$(extract_json "$SCHEDULE_1_RESPONSE" "['data']['id']")
    echo "Schedule 1 ID: $SCHEDULE_ID_1"
else
    log_fail "첫 번째 일정 등록 실패" "$SCHEDULE_1_RESPONSE" "step5_schedule_1"
fi

# 두 번째 일정
SCHEDULE_2_RESPONSE=$(curl -s -X POST "$API_BASE/schedules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "group_id": "'$GROUP_ID'",
    "title": "정규 수업 - 수요일",
    "type": "regular",
    "start_at": "2025-11-21T19:00:00",
    "end_at": "2025-11-21T21:00:00",
    "status": "confirmed",
    "recurrence_rule": {
      "frequency": "weekly",
      "interval": 1,
      "by_day": ["wednesday"]
    },
    "location": "강남역 스터디카페",
    "memo": "수요일 정규 수업"
  }')

if echo "$SCHEDULE_2_RESPONSE" | grep -q '"success":true'; then
    log_pass "두 번째 일정 등록 성공" "step5_schedule_2"
    SCHEDULE_ID_2=$(extract_json "$SCHEDULE_2_RESPONSE" "['data']['id']")
    echo "Schedule 2 ID: $SCHEDULE_ID_2"
else
    log_fail "두 번째 일정 등록 실패" "$SCHEDULE_2_RESPONSE" "step5_schedule_2"
fi

# ============================================================
# Note: Steps 6-13 require a student to be registered and joined
# For a complete E2E test, we would need to:
# - Register a student account
# - Join the group using invite code
# - Then continue with attendance, lesson records, etc.
# ============================================================

echo ""
echo "============================================================"
echo "📊 Test Results Summary"
echo "============================================================"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo "Total: $((PASS_COUNT + FAIL_COUNT))"
echo ""

# Save results to file
echo "{" > "$RESULTS_FILE"
echo "  \"test_date\": \"$TEST_DATE\"," >> "$RESULTS_FILE"
echo "  \"test_type\": \"teacher_flow\"," >> "$RESULTS_FILE"
echo "  \"pass_count\": $PASS_COUNT," >> "$RESULTS_FILE"
echo "  \"fail_count\": $FAIL_COUNT," >> "$RESULTS_FILE"
echo "  \"total_count\": $((PASS_COUNT + FAIL_COUNT))," >> "$RESULTS_FILE"
echo "  \"tests\": {" >> "$RESULTS_FILE"

first=true
for key in "${!TEST_RESULTS[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$RESULTS_FILE"
    fi
    echo -n "    \"$key\": \"${TEST_RESULTS[$key]}\"" >> "$RESULTS_FILE"
done

echo "" >> "$RESULTS_FILE"
echo "  }," >> "$RESULTS_FILE"
echo "  \"teacher_email\": \"$TEACHER_EMAIL\"," >> "$RESULTS_FILE"
echo "  \"teacher_id\": \"$TEACHER_ID\"," >> "$RESULTS_FILE"
echo "  \"group_id\": \"$GROUP_ID\"," >> "$RESULTS_FILE"
echo "  \"invite_code\": \"$INVITE_CODE\"" >> "$RESULTS_FILE"
echo "}" >> "$RESULTS_FILE"

echo "Results saved to: $RESULTS_FILE"
echo "============================================================"

if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
fi

exit 0
