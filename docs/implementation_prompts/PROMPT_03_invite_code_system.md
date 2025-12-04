# 구현 프롬프트 #03: 초대 코드 시스템 (보안 강화) ⭐⭐

**우선순위**: 높음 (보안 요구사항)
**예상 소요 시간**: 1-2일
**난이도**: 중간
**담당 기능**: F-001 회원가입 및 로그인, F-002 과외 그룹 생성 및 매칭

---

## 1. 목표

현재 누구나 모든 역할(선생님/학생/학부모)로 자유롭게 가입할 수 있는 구조를 변경하여, **학생과 학부모는 반드시 선생님의 초대 코드를 통해서만 가입**할 수 있도록 보안을 강화합니다.

**핵심 설계 원칙** (F-001 명세서):
1. **선생님만 독립적으로 가입 가능**
2. **학생/학부모는 초대 코드 필수**
3. **초대 코드는 특정 그룹과 연결됨**
4. **가입 즉시 해당 그룹에 자동 추가**

---

## 2. 관련 문서

**필수 참조**:
- `/F-001_회원가입_및_로그인.md` (시나리오 2, 3: 초대 코드로 가입)
- `/F-002_과외_그룹_생성_및_매칭.md` (초대 코드 생성 및 관리)
- `/API_명세서.md` (POST /api/v1/auth/register, POST /api/v1/invite-codes)
- `/데이터베이스_설계서.md` (invite_codes 테이블)

---

## 3. 구현 범위

### 3.1 프론트엔드
1. 회원가입 플로우 수정 (역할 선택에 따라 분기)
2. 초대 코드 입력 페이지 신규 구현
3. 초대 코드 생성 UI (선생님용)
4. 초대 코드 관리 페이지 (선생님용)

### 3.2 백엔드 (참고용)
1. 초대 코드 생성 API
2. 초대 코드 검증 API
3. 회원가입 시 초대 코드 검증 로직
4. 가입 후 자동 그룹 추가 로직

---

## 4. 초대 코드 스펙

### 4.1 코드 형식
```
형식: 6자리 영문 대문자 + 숫자
예시: AB12CD, XY56ZW, QW78ER
생성 방법: 랜덤 (중복 체크)
```

### 4.2 코드 속성
```typescript
interface InviteCode {
  id: string;
  code: string;           // 6자리 코드 (예: AB12CD)
  groupId: string;        // 어느 그룹의 초대 코드인지
  createdBy: string;      // 생성한 선생님 ID
  roleType: 'STUDENT' | 'PARENT'; // 이 코드로 가입할 수 있는 역할
  expiresAt: string;      // 만료 시간 (생성 후 7일)
  usedAt?: string;        // 사용된 시간
  usedBy?: string;        // 사용한 사용자 ID
  maxUses: number;        // 최대 사용 횟수 (기본 1)
  currentUses: number;    // 현재 사용 횟수
  isActive: boolean;      // 활성화 여부
}
```

### 4.3 비즈니스 규칙
- **유효 기간**: 생성 후 7일
- **사용 횟수**: 기본 1회 (선생님이 설정 가능)
- **역할 구분**: 학생용 코드, 학부모용 코드 분리 생성
- **만료 처리**: 만료된 코드는 재사용 불가

---

## 5. 프론트엔드 구현

### 5.1 회원가입 플로우 수정

#### 현재 구조 (문제점):
```
/signup → 모든 역할 선택 가능 → 바로 회원가입
```

#### 변경 구조:
```
/signup
  ├─ 선생님 선택 → 바로 회원가입 폼
  └─ 학생/학부모 선택 → 초대 코드 입력 → 검증 성공 → 회원가입 폼
```

### 5.2 수정할 파일

```tsx
// frontend/src/app/(auth)/signup/page.tsx (기존 파일 수정)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleSelectionStep from '@/components/auth/RoleSelectionStep';
import InviteCodeStep from '@/components/auth/InviteCodeStep';
import SignupFormStep from '@/components/auth/SignupFormStep';

type UserRole = 'teacher' | 'student' | 'parent';
type SignupStep = 'role' | 'inviteCode' | 'form';

export default function SignupPage() {
  const router = useRouter();

  // 현재 단계
  const [currentStep, setCurrentStep] = useState<SignupStep>('role');

  // 선택한 역할
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 초대 코드 정보
  const [inviteCodeData, setInviteCodeData] = useState<{
    code: string;
    groupName: string;
    teacherName: string;
  } | null>(null);

  // 역할 선택 핸들러
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);

    if (role === 'teacher') {
      // 선생님은 바로 가입 폼으로
      setCurrentStep('form');
    } else {
      // 학생/학부모는 초대 코드 입력으로
      setCurrentStep('inviteCode');
    }
  };

  // 초대 코드 검증 성공 핸들러
  const handleInviteCodeVerified = (data: any) => {
    setInviteCodeData(data);
    setCurrentStep('form');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* 진행 상태 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'role' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            {selectedRole !== 'teacher' && (
              <>
                <div className="w-8 h-1 bg-gray-300"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'inviteCode' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
              </>
            )}
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {selectedRole === 'teacher' ? '2' : '3'}
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            {currentStep === 'role' && '역할 선택'}
            {currentStep === 'inviteCode' && '초대 코드 입력'}
            {currentStep === 'form' && '정보 입력'}
          </div>
        </div>

        {/* 단계별 컴포넌트 */}
        {currentStep === 'role' && (
          <RoleSelectionStep onSelect={handleRoleSelect} />
        )}

        {currentStep === 'inviteCode' && selectedRole && (
          <InviteCodeStep
            role={selectedRole}
            onVerified={handleInviteCodeVerified}
            onBack={() => setCurrentStep('role')}
          />
        )}

        {currentStep === 'form' && selectedRole && (
          <SignupFormStep
            role={selectedRole}
            inviteCode={inviteCodeData?.code}
            onBack={() => {
              if (selectedRole === 'teacher') {
                setCurrentStep('role');
              } else {
                setCurrentStep('inviteCode');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
```

---

### 5.3 역할 선택 컴포넌트

```tsx
// frontend/src/components/auth/RoleSelectionStep.tsx (신규)

'use client';

import React from 'react';

interface RoleSelectionStepProps {
  onSelect: (role: 'teacher' | 'student' | 'parent') => void;
}

export default function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-2">회원가입</h2>
      <p className="text-center text-gray-600 mb-8">
        어떤 사용자이신가요?
      </p>

      <div className="space-y-4">
        {/* 선생님 */}
        <button
          onClick={() => onSelect('teacher')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              👨‍🏫
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">선생님</h3>
              <p className="text-sm text-gray-600">
                과외를 진행하고 학생을 관리합니다
              </p>
            </div>
            <div className="text-blue-600 text-xl">→</div>
          </div>
        </button>

        {/* 학생 */}
        <button
          onClick={() => onSelect('student')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              👨‍🎓
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">학생</h3>
              <p className="text-sm text-gray-600">
                수업을 듣고 숙제를 제출합니다 <span className="text-orange-600">(초대 코드 필요)</span>
              </p>
            </div>
            <div className="text-green-600 text-xl">→</div>
          </div>
        </button>

        {/* 학부모 */}
        <button
          onClick={() => onSelect('parent')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
              👨‍👩‍👧
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">학부모</h3>
              <p className="text-sm text-gray-600">
                자녀의 학습을 확인하고 비용을 결제합니다 <span className="text-orange-600">(초대 코드 필요)</span>
              </p>
            </div>
            <div className="text-purple-600 text-xl">→</div>
          </div>
        </button>
      </div>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
```

---

### 5.4 초대 코드 입력 컴포넌트

```tsx
// frontend/src/components/auth/InviteCodeStep.tsx (신규)

'use client';

import React, { useState } from 'react';

interface InviteCodeStepProps {
  role: 'student' | 'parent';
  onVerified: (data: { code: string; groupName: string; teacherName: string }) => void;
  onBack: () => void;
}

export default function InviteCodeStep({ role, onVerified, onBack }: InviteCodeStepProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 클라이언트 검증
    if (code.length !== 6) {
      setErrorMessage('초대 코드는 6자리입니다');
      return;
    }

    setIsLoading(true);

    try {
      // 초대 코드 검증 API 호출
      const response = await fetch(`/api/v1/invite-codes/${code}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role_type: role.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '초대 코드를 확인해주세요');
      }

      const data = await response.json();

      // 검증 성공 → 다음 단계로
      onVerified({
        code: code,
        groupName: data.groupName,
        teacherName: data.teacherName,
      });

    } catch (error: any) {
      if (error.message.includes('만료')) {
        setErrorMessage('초대 코드가 만료되었습니다. 선생님께 새 코드를 요청해주세요.');
      } else if (error.message.includes('이미 사용')) {
        setErrorMessage('이미 사용된 초대 코드입니다. 선생님께 새 코드를 요청해주세요.');
      } else if (error.message.includes('유효하지')) {
        setErrorMessage('유효하지 않은 초대 코드입니다. 다시 확인해주세요.');
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        ← 뒤로
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">초대 코드 입력</h2>
      <p className="text-center text-gray-600 mb-8">
        선생님께 받은 초대 코드를 입력해주세요
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 초대 코드 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            초대 코드 (6자리)
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
            placeholder="AB12CD"
            disabled={isLoading}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">
            영문 대문자와 숫자로 이루어진 6자리 코드입니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* 확인 버튼 */}
        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '확인 중...' : '다음'}
        </button>
      </form>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 초대 코드가 없으신가요?<br />
          선생님께 카카오톡이나 문자로 초대 코드를 요청해주세요.
        </p>
      </div>
    </div>
  );
}
```

---

### 5.5 회원가입 폼 컴포넌트 수정

```tsx
// frontend/src/components/auth/SignupFormStep.tsx (기존 signup 페이지 로직 분리)

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/authApi';

interface SignupFormStepProps {
  role: 'teacher' | 'student' | 'parent';
  inviteCode?: string; // 학생/학부모만 있음
  onBack: () => void;
}

export default function SignupFormStep({ role, inviteCode, onBack }: SignupFormStepProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);

    try {
      await registerWithEmail({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: role.toUpperCase() as any,
        inviteCode: inviteCode, // 학생/학부모만 전송
      });

      alert('회원가입이 완료되었습니다!');
      router.push('/login');

    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      {/* 뒤로가기 */}
      <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-900">
        ← 뒤로
      </button>

      <h2 className="text-2xl font-bold text-center mb-8">정보 입력</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 이름, 이메일, 비밀번호 등 기존 필드 */}
        {/* ... (기존 signup 페이지와 동일) ... */}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg"
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
}
```

---

## 6. 초대 코드 생성 UI (선생님용)

### 6.1 그룹 상세 페이지에 추가

```tsx
// app/(main)/groups/[groupId]/page.tsx

<section className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">초대 코드 관리</h3>

  <div className="space-y-4">
    {/* 학생 초대 코드 생성 */}
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <p className="font-medium">학생 초대 코드</p>
        <p className="text-sm text-gray-600">학생을 초대할 수 있는 코드를 생성합니다</p>
      </div>
      <button
        onClick={() => handleGenerateInviteCode('STUDENT')}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        생성하기
      </button>
    </div>

    {/* 학부모 초대 코드 생성 */}
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <p className="font-medium">학부모 초대 코드</p>
        <p className="text-sm text-gray-600">학부모를 초대할 수 있는 코드를 생성합니다</p>
      </div>
      <button
        onClick={() => handleGenerateInviteCode('PARENT')}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        생성하기
      </button>
    </div>

    {/* 생성된 코드 목록 */}
    {inviteCodes.length > 0 && (
      <div className="mt-6">
        <h4 className="font-medium mb-3">생성된 초대 코드</h4>
        <div className="space-y-2">
          {inviteCodes.map((code) => (
            <InviteCodeCard key={code.id} code={code} />
          ))}
        </div>
      </div>
    )}
  </div>
</section>
```

### 6.2 초대 코드 카드 컴포넌트

```tsx
// components/groups/InviteCodeCard.tsx

interface InviteCodeCardProps {
  code: {
    code: string;
    roleType: 'STUDENT' | 'PARENT';
    expiresAt: string;
    isActive: boolean;
    usedAt?: string;
  };
}

export default function InviteCodeCard({ code }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(code.expiresAt) < new Date();

  return (
    <div className={`p-4 border rounded-lg ${
      code.usedAt ? 'bg-gray-50 border-gray-300' :
      isExpired ? 'bg-red-50 border-red-300' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold">{code.code}</span>
            <span className={`px-2 py-1 text-xs rounded ${
              code.roleType === 'STUDENT'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {code.roleType === 'STUDENT' ? '학생용' : '학부모용'}
            </span>
            {code.usedAt && (
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                사용됨
              </span>
            )}
            {isExpired && !code.usedAt && (
              <span className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded">
                만료됨
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            만료: {new Date(code.expiresAt).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {!code.usedAt && !isExpired && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 7. API 연동

### 7.1 초대 코드 검증 API

```typescript
// POST /api/v1/invite-codes/{code}/verify

// 요청
{
  "role_type": "STUDENT" | "PARENT"
}

// 응답 (성공)
{
  "valid": true,
  "groupId": "group-123",
  "groupName": "수학 과외반",
  "teacherName": "김선생",
  "expiresAt": "2024-01-08T00:00:00Z"
}

// 응답 (실패)
{
  "valid": false,
  "message": "유효하지 않은 초대 코드입니다"
}
```

### 7.2 초대 코드 생성 API

```typescript
// POST /api/v1/invite-codes

// 요청
{
  "group_id": "group-123",
  "role_type": "STUDENT" | "PARENT",
  "max_uses": 1,  // 선택
  "expires_in_days": 7  // 선택
}

// 응답
{
  "id": "invite-456",
  "code": "AB12CD",
  "groupId": "group-123",
  "roleType": "STUDENT",
  "expiresAt": "2024-01-08T00:00:00Z",
  "maxUses": 1,
  "currentUses": 0,
  "isActive": true
}
```

---

## 8. 검증 방법

### 8.1 선생님 가입 플로우
1. `/signup` 접근
2. "선생님" 선택
3. 바로 정보 입력 폼으로 이동 (초대 코드 단계 없음) ✅
4. 정보 입력 후 가입 완료

### 8.2 학생 가입 플로우
1. `/signup` 접근
2. "학생" 선택
3. 초대 코드 입력 화면 표시 ✅
4. 잘못된 코드 입력 → 에러 메시지 ✅
5. 올바른 코드 입력 → 정보 입력 폼으로 이동 ✅
6. 정보 입력 후 가입 완료
7. 자동으로 해당 그룹에 추가됨 ✅

### 8.3 초대 코드 생성 (선생님)
1. 그룹 상세 페이지 접근
2. "학생 초대 코드 생성" 버튼 클릭
3. 6자리 코드 생성됨 (예: AB12CD) ✅
4. 코드 복사 기능 작동 ✅
5. 카톡/문자로 공유 가능

### 8.4 보안 검증
1. 만료된 코드 입력 → "만료되었습니다" 에러 ✅
2. 이미 사용된 코드 입력 → "이미 사용됨" 에러 ✅
3. 학생용 코드로 학부모 가입 시도 → "유효하지 않음" 에러 ✅
4. 선생님이 다른 선생님의 코드 확인 시도 → 403 에러 ✅

---

## 9. 완료 기준 (Definition of Done)

- [ ] 회원가입 페이지를 3단계로 분리 (역할 선택 → 초대 코드 → 정보 입력)
- [ ] RoleSelectionStep 컴포넌트 구현
- [ ] InviteCodeStep 컴포넌트 구현
- [ ] SignupFormStep 컴포넌트 구현
- [ ] 초대 코드 검증 API 연동
- [ ] 선생님은 초대 코드 없이 가입 가능
- [ ] 학생/학부모는 초대 코드 필수
- [ ] 초대 코드 생성 UI (그룹 상세 페이지)
- [ ] InviteCodeCard 컴포넌트 구현
- [ ] 코드 복사 기능
- [ ] 만료/사용됨 상태 표시
- [ ] 에러 케이스 처리 (만료, 중복 사용, 역할 불일치)
- [ ] 실제 플로우 테스트 완료

---

**구현 시작 전 확인사항**:
1. F-001_회원가입_및_로그인.md 시나리오 2, 3 읽기
2. F-002_과외_그룹_생성_및_매칭.md 초대 코드 섹션 읽기
3. 백엔드 초대 코드 API 준비 상태 확인
4. 기존 signup 페이지 백업
