'use client';

import React from 'react';
import { getNumberColorClass } from '@/lib/utils';

interface NumberChipProps {
  number: number;
  isBonus?: boolean;
}

export function NumberChip({ number, isBonus = false }: NumberChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getNumberColorClass(number)} ${
        isBonus ? 'ring-2 ring-offset-2 ring-gray-800' : ''
      }`}
      aria-label={`${isBonus ? '보너스 ' : ''}번호 ${number}`}
    >
      {number}
    </span>
  );
}