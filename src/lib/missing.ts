import type { Draw } from '@/types/lotto';

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
}