/**
 * Design Demo Page
 * Showcases the new Bento Grid design system
 *
 * This page demonstrates:
 * - BentoCard component with various configurations
 * - BentoGrid layout
 * - Aurora background effects
 * - Updated Button, Input, Badge components
 * - Glassmorphism effects
 */

'use client';

import React, { useState } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import BentoCard from '@/components/ui/BentoCard';
import BentoGrid from '@/components/ui/BentoGrid';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

export default function DesignDemoPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <PageBackground aurora={true}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WeTee Design System Demo
          </h1>
          <p className="text-lg text-gray-600">
            Bento Grid 레이아웃과 Apple 스타일의 미니멀리즘 디자인 시스템
          </p>
        </div>

        {/* Section 1: Bento Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            1. Bento Cards
          </h2>

          <BentoGrid cols={3} gap="medium">
            {/* Card 1: Basic Card */}
            <BentoCard size="medium">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                기본 카드
              </h3>
              <p className="text-gray-600">
                40px 둥근 모서리와 부드러운 그림자가 특징입니다.
              </p>
            </BentoCard>

            {/* Card 2: Interactive Card */}
            <BentoCard size="medium" interactive onClick={() => alert('클릭!')}>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                인터랙티브 카드
              </h3>
              <p className="text-gray-600">
                호버 시 위로 올라가는 애니메이션이 적용됩니다.
              </p>
              <Badge variant="info" className="mt-3">
                클릭 가능
              </Badge>
            </BentoCard>

            {/* Card 3: Gradient Card */}
            <BentoCard size="medium" gradient="purple">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="text-xl font-bold text-gray-900">AI 인사이트</h3>
              </div>
              <p className="text-gray-700">
                그라데이션 배경으로 특별한 기능을 강조합니다.
              </p>
            </BentoCard>

            {/* Card 4: Large Card with Stats */}
            <BentoCard size="large" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  이번 달 수익
                </h3>
                <span className="text-3xl font-bold text-primary-500">
                  ₩1,200,000
                </span>
              </div>

              {/* Mock Chart */}
              <div className="flex items-end gap-2 h-32">
                {[40, 65, 50, 80, 70, 90, 85].map((height, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <Badge variant="success">+15%</Badge>
                <span className="text-sm text-gray-600">지난 달 대비</span>
              </div>
            </BentoCard>

            {/* Card 5: Glass Card */}
            <BentoCard size="medium" glass>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Glassmorphism
              </h3>
              <p className="text-gray-700">
                반투명 배경과 블러 효과가 적용된 유리 같은 질감입니다.
              </p>
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Section 2: Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            2. Buttons
          </h2>

          <BentoCard size="large">
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Primary
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="small">
                    Small
                  </Button>
                  <Button variant="primary" size="medium">
                    Medium
                  </Button>
                  <Button variant="primary" size="large">
                    Large
                  </Button>
                  <Button variant="primary" size="medium" disabled>
                    Disabled
                  </Button>
                  <Button variant="primary" size="medium" loading>
                    Loading
                  </Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Secondary
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="medium">
                    취소
                  </Button>
                  <Button variant="outline" size="medium">
                    Outline
                  </Button>
                  <Button variant="text" size="medium">
                    Text Only
                  </Button>
                  <Button variant="ghost" size="medium">
                    Ghost
                  </Button>
                </div>
              </div>

              {/* Danger Button */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Danger
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="danger" size="medium">
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        {/* Section 3: Badges */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            3. Badges
          </h2>

          <BentoCard size="large">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  출석 상태
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success" size="medium">
                    출석
                  </Badge>
                  <Badge variant="warning" size="medium">
                    지각
                  </Badge>
                  <Badge variant="error" size="medium">
                    결석
                  </Badge>
                  <Badge variant="default" size="medium">
                    미정
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  기타 상태
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="info" size="small">
                    정보
                  </Badge>
                  <Badge variant="purple" size="medium">
                    AI 추천
                  </Badge>
                  <Badge variant="success" size="large">
                    완료
                  </Badge>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        {/* Section 4: Inputs */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            4. Input Fields
          </h2>

          <BentoCard size="large">
            <div className="space-y-6 max-w-lg">
              <Input
                type="text"
                label="이름"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={setName}
                required
              />

              <Input
                type="email"
                label="이메일"
                placeholder="example@wetee.com"
                value={email}
                onChange={setEmail}
                helperText="로그인에 사용할 이메일 주소를 입력하세요"
              />

              <Input
                type="password"
                label="비밀번호"
                placeholder="••••••••"
                value=""
                onChange={() => {}}
              />

              <Input
                type="text"
                label="에러 상태"
                placeholder="잘못된 입력"
                value=""
                onChange={() => {}}
                error="이 필드는 필수입니다"
              />

              <Input
                type="text"
                label="성공 상태"
                placeholder="올바른 입력"
                value="올바른 값"
                onChange={() => {}}
                success
              />
            </div>
          </BentoCard>
        </section>

        {/* Section 5: Dashboard Example */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            5. Dashboard Example
          </h2>

          <BentoGrid cols={3} gap="medium">
            {/* Quick Stats */}
            <BentoCard size="medium" interactive>
              <div className="text-sm text-gray-600 mb-1">총 학생 수</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">24명</div>
              <Badge variant="success">+3 이번 달</Badge>
            </BentoCard>

            <BentoCard size="medium" interactive>
              <div className="text-sm text-gray-600 mb-1">이번 주 수업</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">12회</div>
              <Badge variant="info">진행 중</Badge>
            </BentoCard>

            <BentoCard size="medium" interactive>
              <div className="text-sm text-gray-600 mb-1">출석률</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">94%</div>
              <Badge variant="success">우수</Badge>
            </BentoCard>

            {/* Calendar Widget */}
            <BentoCard size="large" className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                이번 주 일정
              </h3>
              <div className="space-y-3">
                {[
                  { day: '월', time: '14:00', student: '김민수', status: 'success' },
                  { day: '화', time: '15:00', student: '이지은', status: 'warning' },
                  { day: '수', time: '16:00', student: '박서준', status: 'success' },
                  { day: '목', time: '14:30', student: '최유진', status: 'default' },
                ].map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-900 w-8">
                        {lesson.day}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lesson.student}
                        </div>
                        <div className="text-sm text-gray-600">
                          {lesson.time}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        lesson.status as 'success' | 'warning' | 'default'
                      }
                    >
                      {lesson.status === 'success'
                        ? '출석'
                        : lesson.status === 'warning'
                        ? '지각'
                        : '예정'}
                    </Badge>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Recent Activity */}
            <BentoCard size="large">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                최근 활동
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                  <div>
                    <div className="text-gray-900">새 학생 등록</div>
                    <div className="text-gray-500">2시간 전</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <div>
                    <div className="text-gray-900">수업 완료</div>
                    <div className="text-gray-500">4시간 전</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                  <div>
                    <div className="text-gray-900">결제 확인</div>
                    <div className="text-gray-500">1일 전</div>
                  </div>
                </div>
              </div>
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>WeTee Design System v2.0 - Bento Grid + Apple Minimalism</p>
        </div>
      </div>
    </PageBackground>
  );
}
