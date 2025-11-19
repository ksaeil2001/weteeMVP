'use client';

/**
 * Components Demo Page - WeTee MVP
 * Purpose: Showcase all common UI components with their variants and states
 * Based on: UX_UI_설계서.md Section 5 & 6 (공통 UI 컴포넌트 & 디자인 시스템)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ComponentsDemoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [textArea, setTextArea] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            WeTee UI Components
          </h1>
          <p className="text-gray-600">
            Common components based on UX_UI_설계서.md design system
          </p>
        </div>

        {/* Button Component */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Button Component</h2>

          <Card variant="elevated" padding="large" className="space-y-8">
            {/* Variants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="text">Text Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Sizes</h3>
              <div className="flex flex-wrap items-end gap-4">
                <Button size="small">Small (40px)</Button>
                <Button size="medium">Medium (48px)</Button>
                <Button size="large">Large (56px)</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button loading={isLoading} onClick={handleLoadingDemo}>
                  {isLoading ? 'Loading...' : 'Click to Load'}
                </Button>
                <Button icon={<span>✓</span>}>With Icon</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Input Component */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Input Component</h2>

          <Card variant="elevated" padding="large" className="space-y-6">
            {/* Text Input */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Text Input</h3>
              <Input
                type="text"
                label="이름"
                placeholder="이름을 입력하세요"
                value=""
                onChange={() => {}}
                helperText="최소 2자 이상 입력해주세요"
              />
            </div>

            {/* Email with Validation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Email Input (Real-time Validation)
              </h3>
              <Input
                type="email"
                label="이메일"
                placeholder="example@wetee.com"
                value={email}
                onChange={setEmail}
                required
                helperText="이메일을 입력하면 자동으로 검증됩니다"
              />
            </div>

            {/* Password with Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Password Input (Show/Hide Toggle)
              </h3>
              <Input
                type="password"
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={setPassword}
                required
                helperText="눈 아이콘을 클릭하면 비밀번호를 볼 수 있습니다"
              />
            </div>

            {/* Error State */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Error State</h3>
              <Input
                type="text"
                label="휴대폰 번호"
                placeholder="010-0000-0000"
                value=""
                onChange={() => {}}
                error="올바른 휴대폰 번호 형식이 아닙니다"
              />
            </div>

            {/* Success State */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Success State</h3>
              <Input
                type="text"
                label="사용자명"
                placeholder="username"
                value="john_doe"
                onChange={() => {}}
                success
                helperText="사용 가능한 사용자명입니다"
              />
            </div>

            {/* Textarea with Counter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Textarea with Character Counter
              </h3>
              <Input
                type="textarea"
                label="수업 기록"
                placeholder="오늘 배운 내용을 입력하세요..."
                value={textArea}
                onChange={setTextArea}
                rows={5}
                maxLength={2000}
                showCounter
                helperText="수업 내용을 최대한 자세히 작성해주세요"
              />
            </div>

            {/* Disabled State */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Disabled State</h3>
              <Input
                type="text"
                label="읽기 전용"
                placeholder="수정할 수 없습니다"
                value="Disabled input"
                onChange={() => {}}
                disabled
              />
            </div>
          </Card>
        </section>

        {/* Card Component */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Card Component</h2>

          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="default">
                  <h4 className="font-semibold text-gray-900 mb-2">Default Card</h4>
                  <p className="text-gray-600">Border with subtle outline</p>
                </Card>

                <Card variant="elevated">
                  <h4 className="font-semibold text-gray-900 mb-2">Elevated Card</h4>
                  <p className="text-gray-600">Shadow effect (Level 2)</p>
                </Card>

                <Card variant="outlined">
                  <h4 className="font-semibold text-gray-900 mb-2">Outlined Card</h4>
                  <p className="text-gray-600">Thicker border</p>
                </Card>
              </div>
            </div>

            {/* Padding */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Padding Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card variant="outlined" padding="none">
                  <div className="p-2 bg-blue-50">No Padding</div>
                </Card>

                <Card variant="outlined" padding="small">
                  <div className="bg-blue-50">Small (8pt)</div>
                </Card>

                <Card variant="outlined" padding="medium">
                  <div className="bg-blue-50">Medium (16pt)</div>
                </Card>

                <Card variant="outlined" padding="large">
                  <div className="bg-blue-50">Large (24pt)</div>
                </Card>
              </div>
            </div>

            {/* Clickable Cards */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Clickable Cards (Hover Effect)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  variant="elevated"
                  onClick={() => alert('Card clicked!')}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">수업 카드</h4>
                  <p className="text-gray-600 mb-2">2025.11.19 (화) 15:00-17:00</p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      수학
                    </span>
                    <span className="text-sm text-gray-500">최학생</span>
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  onClick={() => alert('Notification clicked!')}
                  highlighted
                >
                  <h4 className="font-semibold text-gray-900 mb-2">읽지 않은 알림</h4>
                  <p className="text-gray-600">파란색 왼쪽 테두리가 표시됩니다</p>
                </Card>
              </div>
            </div>

            {/* Complex Example */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Complex Card Example (S-012 수업 카드)
              </h3>
              <Card variant="elevated" padding="large">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">수학 수업</h4>
                        <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                          정규
                        </span>
                      </div>
                      <p className="text-gray-600">최학생 · 2025.11.19 (화)</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      출석
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-1">시간</p>
                    <p className="text-gray-900 font-medium">15:00 - 17:00 (2시간)</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="small" className="flex-1">
                      출결 체크
                    </Button>
                    <Button variant="primary" size="small" className="flex-1">
                      수업 기록 작성
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
          <p>WeTee MVP - Common UI Components Demo</p>
          <p className="mt-2">Based on UX_UI_설계서.md Design System</p>
        </footer>
      </div>
    </div>
  );
}
