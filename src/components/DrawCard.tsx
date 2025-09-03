'use client';

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
}