'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { Draw } from '@/types/lotto';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDraws(from?: number, to?: number) {
  const { data, error, isLoading } = useSWR<Draw[]>(
    from && to ? `/api/lotto/bulk?from=${from}&to=${to}` : null,
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
}