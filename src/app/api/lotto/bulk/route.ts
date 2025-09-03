import { NextRequest, NextResponse } from 'next/server';
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
    const cacheKey = `draw-${round}`;
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
}