import type { Draw } from '@/types/lotto';

const DHLOTTERY_API = 'https://www.dhlottery.co.kr/common.do';

export async function fetchDrawFromDhlottery(round: number): Promise<Draw | null> {
  try {
    const url = `${DHLOTTERY_API}?method=getLottoNumber&drwNo=${round}`;
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
    console.error(`Failed to fetch round ${round}:`, error);
    return null;
  }
}