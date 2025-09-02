#!/usr/bin/env node

/**
 * 로또 6/45 뷰어 프로젝트 자동 생성 스크립트
 * 
 * 사용법:
 * 1. 이 파일을 setup-lotto.js로 저장
 * 2. 터미널에서 실행: node setup-lotto.js
 * 3. 자동으로 lotto-viewer 폴더가 생성되고 모든 파일이 설치됩니다
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_NAME = 'lotto-viewer';

// 프로젝트 파일 구조
const FILES = {
  'package.json': `{
  "name": "lotto-viewer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "swr": "^2.2.4",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,

  'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,

  'src/types/lotto.ts': `export interface Draw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export interface ApiError {
  error: string;
}`,

  'src/lib/utils.ts': `export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function getNumberColor(num: number): string {
  if (num <= 10) return '#FACC15';
  if (num <= 20) return '#3B82F6';
  if (num <= 30) return '#EF4444';
  if (num <= 40) return '#9CA3AF';
  return '#22C55E';
}

export function getNumberColorClass(num: number): string {
  if (num <= 10) return 'bg-yellow-400 text-gray-900';
  if (num <= 20) return 'bg-blue-500 text-white';
  if (num <= 30) return 'bg-red-500 text-white';
  if (num <= 40) return 'bg-gray-400 text-white';
  return 'bg-green-500 text-white';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return \`\${year}.\${month}.\${day}\`;
}`,

  'src/lib/cache.ts': `const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 86400000; // 24시간

export function getCache(key: string) {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCache(key: string, data: any) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}`,

  'src/lib/lotto-api.ts': `import type { Draw } from '@/types/lotto';

const DHLOTTERY_API = 'https://www.dhlottery.co.kr/common.do';

export async function fetchDrawFromDhlottery(round: number): Promise<Draw | null> {
  try {
    const url = \`\${DHLOTTERY_API}?method=getLottoNumber&drwNo=\${round}\`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.returnValue !== 'success') {
      return null;
    }
    
    const date = new Date(data.drwNoDate).toISOString().split('T')[0];
    
    return {
      round: data.drwNo,
      date,
      numbers: [
        data.drwtNo1,
        data.drwtNo2,
        data.drwtNo3,
        data.drwtNo4,
        data.drwtNo5,
        data.drwtNo6,
      ],
      bonus: data.bnusNo,
    };
  } catch (error) {
    console.error(\`Failed to fetch round \${round}:\`, error);
    return null;
  }
}`,

  'src/lib/missing.ts': `import type { Draw } from '@/types/lotto';

export function findMissingNumbers(draws: Draw[], weeks: number): number[] {
  const recentDraws = draws.slice(0, weeks);
  const appearedNumbers = new Set<number>();
  
  recentDraws.forEach(draw => {
    draw.numbers.forEach(num => appearedNumbers.add(num));
  });
  
  const missing: number[] = [];
  for (let i = 1; i <= 45; i++) {
    if (!appearedNumbers.has(i)) {
      missing.push(i);
    }
  }
  
  return missing.sort((a, b) => a - b);
}

export function findConsecutiveMissing(draws: Draw[]): Array<{ number: number; streak: number }> {
  const streaks = new Map<number, number>();
  
  for (let i = 1; i <= 45; i++) {
    streaks.set(i, 0);
  }
  
  for (const draw of draws) {
    const appeared = new Set(draw.numbers);
    
    for (let i = 1; i <= 45; i++) {
      if (!appeared.has(i)) {
        streaks.set(i, (streaks.get(i) || 0) + 1);
      }
    }
  }
  
  const result: Array<{ number: number; streak: number }> = [];
  streaks.forEach((streak, number) => {
    if (streak >= 10) {
      result.push({ number, streak });
    }
  });
  
  return result.sort((a, b) => b.streak - a.streak);
}`,

  'src/components/NumberChip.tsx': `'use client';

import React from 'react';
import { getNumberColorClass } from '@/lib/utils';

interface NumberChipProps {
  number: number;
  isBonus?: boolean;
}

export function NumberChip({ number, isBonus = false }: NumberChipProps) {
  return (
    <span
      className={\`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm \${getNumberColorClass(number)} \${
        isBonus ? 'ring-2 ring-offset-2 ring-gray-800' : ''
      }\`}
      aria-label={\`\${isBonus ? '보너스 ' : ''}번호 \${number}\`}
    >
      {number}
    </span>
  );
}`,

  'src/components/DrawCard.tsx': `'use client';

import React from 'react';
import { Draw } from '@/types/lotto';
import { NumberChip } from './NumberChip';
import { formatDate } from '@/lib/utils';

interface DrawCardProps {
  draw: Draw;
  nextDraw?: Draw | null;
  showNext?: boolean;
}

export function DrawCard({ draw, nextDraw, showNext = false }: DrawCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{draw.round}회차</h3>
        <span className="text-gray-600">{formatDate(draw.date)}</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {draw.numbers.map((num) => (
          <NumberChip key={num} number={num} />
        ))}
        <NumberChip number={draw.bonus} isBonus />
      </div>
      
      {showNext && (
        <div className="border-t pt-4">
          {nextDraw ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                다음 회차: {nextDraw.round}회 ({formatDate(nextDraw.date)})
              </div>
              <div className="flex gap-1 flex-wrap">
                {nextDraw.numbers.map((num) => (
                  <span key={num} className="scale-75 origin-left">
                    <NumberChip number={num} />
                  </span>
                ))}
                <span className="scale-75 origin-left">
                  <NumberChip number={nextDraw.bonus} isBonus />
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">다음 회차 데이터 없음</div>
          )}
        </div>
      )}
    </div>
  );
}`,

  'src/hooks/useDraws.ts': `'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { Draw } from '@/types/lotto';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDraws(from?: number, to?: number) {
  const { data, error, isLoading } = useSWR<Draw[]>(
    from && to ? \`/api/lotto/bulk?from=\${from}&to=\${to}\` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    draws: data || [],
    isLoading,
    error,
  };
}

export function useLatestDraws(count: number = 5) {
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  
  useEffect(() => {
    const today = new Date();
    const startDate = new Date('2002-12-07');
    const weeksDiff = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const estimatedLatest = Math.min(weeksDiff + 1, 1150);
    
    setRange({
      from: Math.max(1, estimatedLatest - count + 1),
      to: estimatedLatest,
    });
  }, [count]);
  
  return useDraws(range?.from, range?.to);
}`,

  'src/app/api/lotto/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { fetchDrawFromDhlottery } from '@/lib/lotto-api';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get('round');
  
  if (!round || isNaN(Number(round))) {
    return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
  }
  
  const roundNum = Number(round);
  const cacheKey = \`draw-\${roundNum}\`;
  
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
      },
    });
  }
  
  const draw = await fetchDrawFromDhlottery(roundNum);
  
  if (!draw) {
    return NextResponse.json({ error: 'not_ready' }, { status: 404 });
  }
  
  setCache(cacheKey, draw);
  
  return NextResponse.json(draw, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
    },
  });
}`,

  'src/app/api/lotto/bulk/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { fetchDrawFromDhlottery } from '@/lib/lotto-api';
import { getCache, setCache } from '@/lib/cache';
import { Draw } from '@/types/lotto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  if (!from || !to || isNaN(Number(from)) || isNaN(Number(to))) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }
  
  const fromNum = Number(from);
  const toNum = Number(to);
  
  if (fromNum > toNum || toNum - fromNum > 100) {
    return NextResponse.json({ error: 'Invalid range (max 100 draws)' }, { status: 400 });
  }
  
  const draws: Draw[] = [];
  
  for (let round = fromNum; round <= toNum; round++) {
    const cacheKey = \`draw-\${round}\`;
    let draw = getCache(cacheKey);
    
    if (!draw) {
      draw = await fetchDrawFromDhlottery(round);
      if (draw) {
        setCache(cacheKey, draw);
      }
    }
    
    if (draw) {
      draws.push(draw);
    }
  }
  
  return NextResponse.json(draws, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
    },
  });
}`,

  'src/app/layout.tsx': `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '로또 6/45 뷰어',
  description: '대한민국 로또 6/45 분석 도구',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`,

  'src/app/page.tsx': `'use client';

import React, { useState } from 'react';
import { DrawCard } from '@/components/DrawCard';
import { NumberChip } from '@/components/NumberChip';
import { useLatestDraws } from '@/hooks/useDraws';
import { findMissingNumbers, findConsecutiveMissing } from '@/lib/missing';
import type { Draw } from '@/types/lotto';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'missing'>('home');
  const [searchNumber, setSearchNumber] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ draw: Draw; nextDraw?: Draw }>>([]);
  const [missingTab, setMissingTab] = useState<'5weeks' | '10weeks' | '10plus'>('5weeks');
  
  const { draws, isLoading } = useLatestDraws(50);

  const handleSearch = () => {
    const num = parseInt(searchNumber);
    if (num < 1 || num > 45 || isNaN(num)) {
      alert('1~45 사이의 숫자를 입력해주세요');
      return;
    }

    const results = draws
      .filter(draw => draw.numbers.includes(num))
      .map((draw) => {
        const currentIndex = draws.findIndex(d => d.round === draw.round);
        const nextDraw = currentIndex > 0 ? draws[currentIndex - 1] : undefined;
        return { draw, nextDraw };
      });

    setSearchResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">로또 6/45 뷰어</h1>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={\`py-4 px-1 border-b-2 font-medium text-sm \${
                activeTab === 'home'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }\`}
            >
              홈
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={\`py-4 px-1 border-b-2 font-medium text-sm \${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }\`}
            >
              숫자 조회
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={\`py-4 px-1 border-b-2 font-medium text-sm \${
                activeTab === 'missing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }\`}
            >
              미출 분석
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">최근 5회차 당첨번호</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {draws.slice(0, 5).map(draw => (
                    <DrawCard key={draw.round} draw={draw} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4">숫자 조회</h2>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      min="1"
                      max="45"
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                      placeholder="1~45 숫자 입력"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      검색
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {searchNumber}번이 당첨된 회차 ({searchResults.length}개)
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {searchResults.map(({ draw, nextDraw }) => (
                        <DrawCard key={draw.round} draw={draw} nextDraw={nextDraw} showNext />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'missing' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="border-b">
                    <div className="flex">
                      <button
                        onClick={() => setMissingTab('5weeks')}
                        className={\`flex-1 py-3 px-4 text-center font-medium \${
                          missingTab === '5weeks'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }\`}
                      >
                        5주 미출
                      </button>
                      <button
                        onClick={() => setMissingTab('10weeks')}
                        className={\`flex-1 py-3 px-4 text-center font-medium \${
                          missingTab === '10weeks'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }\`}
                      >
                        10주 미출
                      </button>
                      <button
                        onClick={() => setMissingTab('10plus')}
                        className={\`flex-1 py-3 px-4 text-center font-medium \${
                          missingTab === '10plus'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }\`}
                      >
                        10주+ 연속
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {missingTab === '5weeks' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">최근 5주 미출 번호</h3>
                        <div className="flex gap-2 flex-wrap">
                          {findMissingNumbers(draws, 5).map(num => (
                            <NumberChip key={num} number={num} />
                          ))}
                        </div>
                      </div>
                    )}

                    {missingTab === '10weeks' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">최근 10주 미출 번호</h3>
                        <div className="flex gap-2 flex-wrap">
                          {findMissingNumbers(draws, 10).map(num => (
                            <NumberChip key={num} number={num} />
                          ))}
                        </div>
                      </div>
                    )}

                    {missingTab === '10plus' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">10주 이상 연속 미출</h3>
                        <div className="space-y-2">
                          {findConsecutiveMissing(draws).map(({ number, streak }) => (
                            <div key={number} className="flex items-center gap-3">
                              <NumberChip number={number} />
                              <span className="text-gray-600">{streak}주 연속 미출</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}`,

  'data/draws.json': `[
  {"round": 1150, "date": "2024-12-21", "numbers": [7, 11, 16, 21, 27, 33], "bonus": 24},
  {"round": 1149, "date": "2024-12-14", "numbers": [2, 5, 15, 18, 19, 23], "bonus": 42},
  {"round": 1148, "date": "2024-12-07", "numbers": [1, 8, 13, 36, 44, 45], "bonus": 12},
  {"round": 1147, "date": "2024-11-30", "numbers": [6, 14, 16, 18, 24, 32], "bonus": 40},
  {"round": 1146, "date": "2024-11-23", "numbers": [3, 12, 20, 23, 31, 35], "bonus": 43},
  {"round": 1145, "date": "2024-11-16", "numbers": [4, 7, 15, 16, 38, 41], "bonus": 28},
  {"round": 1144, "date": "2024-11-09", "numbers": [10, 14, 22, 24, 28, 37], "bonus": 26},
  {"round": 1143, "date": "2024-11-02", "numbers": [2, 9, 16, 25, 26, 40], "bonus": 42},
  {"round": 1142, "date": "2024-10-26", "numbers": [5, 13, 17, 23, 28, 36], "bonus": 22},
  {"round": 1141, "date": "2024-10-19", "numbers": [1, 6, 13, 37, 38, 40], "bonus": 45},
  {"round": 1140, "date": "2024-10-12", "numbers": [11, 15, 24, 35, 37, 45], "bonus": 3},
  {"round": 1139, "date": "2024-10-05", "numbers": [4, 8, 18, 25, 27, 32], "bonus": 13},
  {"round": 1138, "date": "2024-09-28", "numbers": [7, 17, 19, 23, 24, 45], "bonus": 38},
  {"round": 1137, "date": "2024-09-21", "numbers": [1, 5, 11, 12, 18, 23], "bonus": 9},
  {"round": 1136, "date": "2024-09-14", "numbers": [3, 7, 14, 16, 31, 40], "bonus": 39},
  {"round": 1135, "date": "2024-09-07", "numbers": [6, 12, 17, 21, 34, 37], "bonus": 45},
  {"round": 1134, "date": "2024-08-31", "numbers": [8, 14, 27, 33, 39, 42], "bonus": 10},
  {"round": 1133, "date": "2024-08-24", "numbers": [2, 3, 11, 16, 25, 36], "bonus": 29},
  {"round": 1132, "date": "2024-08-17", "numbers": [5, 9, 12, 20, 21, 26], "bonus": 30},
  {"round": 1131, "date": "2024-08-10", "numbers": [1, 7, 19, 24, 29, 34], "bonus": 13},
  {"round": 1130, "date": "2024-08-03", "numbers": [3, 8, 15, 27, 29, 35], "bonus": 44},
  {"round": 1129, "date": "2024-07-27", "numbers": [12, 18, 21, 25, 29, 45], "bonus": 6},
  {"round": 1128, "date": "2024-07-20", "numbers": [4, 10, 14, 19, 22, 40], "bonus": 35},
  {"round": 1127, "date": "2024-07-13", "numbers": [2, 11, 13, 15, 31, 42], "bonus": 23},
  {"round": 1126, "date": "2024-07-06", "numbers": [5, 7, 20, 25, 28, 37], "bonus": 32},
  {"round": 1125, "date": "2024-06-29", "numbers": [1, 8, 21, 27, 36, 39], "bonus": 14},
  {"round": 1124, "date": "2024-06-22", "numbers": [9, 13, 18, 20, 33, 42], "bonus": 7},
  {"round": 1123, "date": "2024-06-15", "numbers": [3, 11, 17, 23, 34, 41], "bonus": 16},
  {"round": 1122, "date": "2024-06-08", "numbers": [6, 10, 24, 30, 32, 43], "bonus": 15},
  {"round": 1121, "date": "2024-06-01", "numbers": [2, 12, 26, 29, 35, 44], "bonus": 8},
  {"round": 1120, "date": "2024-05-25", "numbers": [4, 15, 19, 22, 38, 41], "bonus": 33},
  {"round": 1119, "date": "2024-05-18", "numbers": [5, 14, 18, 23, 26, 39], "bonus": 11},
  {"round": 1118, "date": "2024-05-11", "numbers": [1, 9, 17, 21, 29, 33], "bonus": 24},
  {"round": 1117, "date": "2024-05-04", "numbers": [7, 12, 16, 24, 34, 45], "bonus": 3},
  {"round": 1116, "date": "2024-04-27", "numbers": [8, 13, 20, 25, 36, 40], "bonus": 27},
  {"round": 1115, "date": "2024-04-20", "numbers": [2, 6, 19, 28, 31, 37], "bonus": 14},
  {"round": 1114, "date": "2024-04-13", "numbers": [3, 10, 15, 22, 35, 42], "bonus": 18},
  {"round": 1113, "date": "2024-04-06", "numbers": [4, 11, 21, 27, 32, 43], "bonus": 12},
  {"round": 1112, "date": "2024-03-30", "numbers": [5, 14, 23, 26, 38, 44], "bonus": 9},
  {"round": 1111, "date": "2024-03-23", "numbers": [1, 7, 17, 30, 33, 39], "bonus": 41}
]`,

  'README.md': `# 🎰 로또 6/45 뷰어/분석 웹앱

대한민국 로또 6/45 당첨번호 조회 및 분석 도구입니다.

## 🚀 빠른 시작

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm run start
\`\`\`

## 🎯 주요 기능

- 최근 당첨번호 조회 (최근 5회차)
- 특정 번호 검색 (해당 번호가 당첨된 모든 회차)
- 미출 번호 분석 (5주/10주/10주+ 연속)
- 번호별 색상 구분 시각화

## 📦 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- SWR (데이터 페칭)

## 🚀 Vercel 배포

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에서 Import
3. 자동 배포 완료!

## 📄 라이선스

MIT`
};

// 메인 실행 함수
async function setup() {
  console.log('🚀 로또 6/45 뷰어 프로젝트 생성 중...\n');

  // 프로젝트 디렉토리 생성
  if (fs.existsSync(PROJECT_NAME)) {
    console.error(`❌ ${PROJECT_NAME} 디렉토리가 이미 존재합니다.`);
    process.exit(1);
  }

  fs.mkdirSync(PROJECT_NAME);
  process.chdir(PROJECT_NAME);

  // 디렉토리 구조 생성
  const dirs = [
    'src',
    'src/app',
    'src/app/api',
    'src/app/api/lotto',
    'src/app/api/lotto/bulk',
    'src/components',
    'src/hooks',
    'src/lib',
    'src/types',
    'data'
  ];

  dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 ${dir} 생성됨`);
  });

  // 파일 생성
  for (const [filePath, content] of Object.entries(FILES)) {
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, content);
    console.log(`📄 ${filePath} 생성됨`);
  }

  console.log('\n📦 의존성 설치 중...');
  console.log('(이 작업은 몇 분 정도 소요될 수 있습니다)\n');

  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ 설치 완료!');
  } catch (error) {
    console.log('\n⚠️  자동 설치 실패. 수동으로 npm install을 실행해주세요.');
  }

  console.log('\n========================================');
  console.log('🎉 로또 6/45 뷰어 프로젝트 생성 완료!');
  console.log('========================================\n');
  console.log('다음 명령어로 시작하세요:');
  console.log(`  cd ${PROJECT_NAME}`);
  console.log('  npm run dev');
  console.log('\n브라우저에서 http://localhost:3000 접속');
  console.log('\n즐거운 개발 되세요! 🚀');
}

// 실행
setup().catch(console.error);