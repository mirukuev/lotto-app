// src/pages/api/lotto.ts  (백업용)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const round = req.query.round as string | undefined;
  if (!round) return res.status(400).json({ error: 'round_required' });

  const upstream = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
  const r = await fetch(upstream, { headers: { Accept: 'application/json' } });
  const data = await r.json().catch(() => ({}));

  if (data?.returnValue !== 'success') return res.status(404).json({ error: 'not_ready' });

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  res.status(200).json({
    round: data.drwNo,
    date: data.drwNoDate,
    numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
    bonus: data.bnusNo,
  });
}
