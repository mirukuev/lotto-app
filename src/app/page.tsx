'use client';

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
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'home'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              홈
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              숫자 조회
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'missing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
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
                        className={`flex-1 py-3 px-4 text-center font-medium ${
                          missingTab === '5weeks'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        5주 미출
                      </button>
                      <button
                        onClick={() => setMissingTab('10weeks')}
                        className={`flex-1 py-3 px-4 text-center font-medium ${
                          missingTab === '10weeks'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        10주 미출
                      </button>
                      <button
                        onClick={() => setMissingTab('10plus')}
                        className={`flex-1 py-3 px-4 text-center font-medium ${
                          missingTab === '10plus'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
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
}