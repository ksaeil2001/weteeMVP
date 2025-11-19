#!/bin/bash

# ============================================================
# WeTee MVP E2E Test - Parent Flow
# 학부모 플로우
# ============================================================

set -e

API_BASE="http://localhost:8000/api/v1"
TEST_DATE=$(date +"%Y-%m-%d")
RESULTS_FILE="/tmp/e2e_parent_results_${TEST_DATE}.json"

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

# Check if invite code is provided as argument
if [ -z "$1" ]; then
    echo "Usage: $0 <invite_code> [group_id]"
    echo "Note: Run teacher flow first to get an invite code"
    exit 1
fi

# Variables
PARENT_EMAIL="parent_e2e_$(date +%s)@test.com"
PARENT_PASSWORD="Parent123!"
PARENT_TOKEN=""
PARENT_ID=""
INVITE_CODE="$1"
GROUP_ID="${2:-}"

echo "============================================================"
echo "🧪 WeTee MVP E2E Test - Parent Flow"
echo "============================================================"
echo "Parent Email: $PARENT_EMAIL"
echo "Invite Code: $INVITE_CODE"
echo "API Base: $API_BASE"
echo ""

# ============================================================
# Step 1: 회원가입 (학부모, PARENT 역할)
# ============================================================
log_test "Step 1: 회원가입 (학부모)"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$PARENT_EMAIL'",
    "password": "'$PARENT_PASSWORD'",
    "name": "테스트 학부모",
    "phone": "010-9876-5432",
    "role": "PARENT"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    log_pass "회원가입 성공" "step1_register"
    PARENT_ID=$(extract_json "$REGISTER_RESPONSE" "['data']['user']['id']")
    echo "Parent ID: $PARENT_ID"
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
    "email": "'$PARENT_EMAIL'",
    "password": "'$PARENT_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    log_pass "로그인 성공" "step2_login"
    PARENT_TOKEN=$(extract_json "$LOGIN_RESPONSE" "['data']['access_token']")
    echo "Token acquired (first 20 chars): ${PARENT_TOKEN:0:20}..."
else
    log_fail "로그인 실패" "$LOGIN_RESPONSE" "step2_login"
    exit 1
fi

# ============================================================
# Step 3: 초대 코드로 그룹 가입
# ============================================================
log_test "Step 3: 초대 코드로 그룹 가입"

JOIN_RESPONSE=$(curl -s -X POST "$API_BASE/groups/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -d '{
    "code": "'$INVITE_CODE'"
  }')

if echo "$JOIN_RESPONSE" | grep -q '"success":true'; then
    log_pass "그룹 가입 성공" "step3_join_group"
    if [ -z "$GROUP_ID" ]; then
        GROUP_ID=$(extract_json "$JOIN_RESPONSE" "['data']['group_id']")
    fi
    echo "Joined Group ID: $GROUP_ID"
else
    log_fail "그룹 가입 실패" "$JOIN_RESPONSE" "step3_join_group"
    # Continue with provided group_id if available
    if [ -z "$GROUP_ID" ]; then
        exit 1
    fi
fi

# ============================================================
# Step 4: 일정 조회 (읽기 전용)
# ============================================================
log_test "Step 4: 일정 조회"

if [ -n "$GROUP_ID" ]; then
    SCHEDULE_RESPONSE=$(curl -s -X GET "$API_BASE/schedules?group_id=$GROUP_ID" \
      -H "Authorization: Bearer $PARENT_TOKEN")

    if echo "$SCHEDULE_RESPONSE" | grep -q '"success":true'; then
        log_pass "일정 조회 성공" "step4_view_schedules"
        SCHEDULE_COUNT=$(echo "$SCHEDULE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
        echo "Found $SCHEDULE_COUNT schedule(s)"
    else
        log_fail "일정 조회 실패" "$SCHEDULE_RESPONSE" "step4_view_schedules"
    fi
else
    log_fail "일정 조회 실패" "No group ID available" "step4_view_schedules"
fi

# ============================================================
# Step 5: 출결 확인
# ============================================================
log_test "Step 5: 출결 확인"

if [ -n "$GROUP_ID" ]; then
    ATTENDANCE_RESPONSE=$(curl -s -X GET "$API_BASE/attendances?group_id=$GROUP_ID" \
      -H "Authorization: Bearer $PARENT_TOKEN")

    if echo "$ATTENDANCE_RESPONSE" | grep -q '"success":true'; then
        log_pass "출결 조회 성공" "step5_view_attendance"
        ATTENDANCE_COUNT=$(echo "$ATTENDANCE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
        echo "Found $ATTENDANCE_COUNT attendance record(s)"
    else
        log_fail "출결 조회 실패" "$ATTENDANCE_RESPONSE" "step5_view_attendance"
    fi
else
    log_fail "출결 조회 실패" "No group ID available" "step5_view_attendance"
fi

# ============================================================
# Step 6: 수업 기록 확인
# ============================================================
log_test "Step 6: 수업 기록 확인"

if [ -n "$GROUP_ID" ]; then
    LESSON_RESPONSE=$(curl -s -X GET "$API_BASE/lesson-records?group_id=$GROUP_ID" \
      -H "Authorization: Bearer $PARENT_TOKEN")

    if echo "$LESSON_RESPONSE" | grep -q '"success":true'; then
        log_pass "수업 기록 조회 성공" "step6_view_lessons"
        LESSON_COUNT=$(echo "$LESSON_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
        echo "Found $LESSON_COUNT lesson record(s)"
    else
        log_fail "수업 기록 조회 실패" "$LESSON_RESPONSE" "step6_view_lessons"
    fi
else
    log_fail "수업 기록 조회 실패" "No group ID available" "step6_view_lessons"
fi

# ============================================================
# Step 7: 청구서 조회
# ============================================================
log_test "Step 7: 청구서 조회"

INVOICE_RESPONSE=$(curl -s -X GET "$API_BASE/invoices" \
  -H "Authorization: Bearer $PARENT_TOKEN")

if echo "$INVOICE_RESPONSE" | grep -q '"success":true'; then
    log_pass "청구서 조회 성공" "step7_view_invoices"
    INVOICE_COUNT=$(echo "$INVOICE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
    echo "Found $INVOICE_COUNT invoice(s)"
else
    log_fail "청구서 조회 실패" "$INVOICE_RESPONSE" "step7_view_invoices"
fi

# ============================================================
# Step 8: 알림 확인
# ============================================================
log_test "Step 8: 알림 확인"

NOTIFICATION_RESPONSE=$(curl -s -X GET "$API_BASE/notifications" \
  -H "Authorization: Bearer $PARENT_TOKEN")

if echo "$NOTIFICATION_RESPONSE" | grep -q '"success":true'; then
    log_pass "알림 조회 성공" "step8_view_notifications"
    NOTIF_COUNT=$(echo "$NOTIFICATION_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
    echo "Found $NOTIF_COUNT notification(s)"
else
    log_fail "알림 조회 실패" "$NOTIFICATION_RESPONSE" "step8_view_notifications"
fi

# ============================================================
# Step 9: 프로필 조회
# ============================================================
log_test "Step 9: 프로필 조회"

PROFILE_RESPONSE=$(curl -s -X GET "$API_BASE/profile" \
  -H "Authorization: Bearer $PARENT_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    log_pass "프로필 조회 성공" "step9_view_profile"
else
    log_fail "프로필 조회 실패" "$PROFILE_RESPONSE" "step9_view_profile"
fi

# ============================================================
# Step 10: 로그아웃
# ============================================================
log_test "Step 10: 로그아웃"

LOGOUT_RESPONSE=$(curl -s -X POST "$API_BASE/auth/logout" \
  -H "Authorization: Bearer $PARENT_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
    log_pass "로그아웃 성공" "step10_logout"
else
    log_fail "로그아웃 실패" "$LOGOUT_RESPONSE" "step10_logout"
fi

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
echo "  \"test_type\": \"parent_flow\"," >> "$RESULTS_FILE"
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
echo "  \"parent_email\": \"$PARENT_EMAIL\"," >> "$RESULTS_FILE"
echo "  \"parent_id\": \"$PARENT_ID\"," >> "$RESULTS_FILE"
echo "  \"group_id\": \"$GROUP_ID\"," >> "$RESULTS_FILE"
echo "  \"invite_code\": \"$INVITE_CODE\"" >> "$RESULTS_FILE"
echo "}" >> "$RESULTS_FILE"

echo "Results saved to: $RESULTS_FILE"
echo "============================================================"

if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
fi

exit 0
