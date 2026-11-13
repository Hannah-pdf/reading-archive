// 방문 기록: POST = 페이지를 열 때 1건 저장, GET = 편집 키가 있을 때만 최근 300건 보기
// 이름·IP는 저장하지 않습니다. 시간, 국가·도시(Vercel이 주는 대략 위치), 기기 종류, 처음 연 화면, 들어온 곳만 남깁니다.
const { redis, isAdmin } = require('./_redis');
const LIST = 'lab:visits';

function device(ua = '') {
  if (/iPad|Tablet/i.test(ua)) return '태블릿';
  if (/Mobi|Android|iPhone/i.test(ua)) return '휴대폰';
  return 'PC';
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const ua = req.headers['user-agent'] || '';
      if (/bot|crawl|spider|preview|headless/i.test(ua)) return res.status(204).end();
      let ref = String(body.ref || '');
      try { ref = ref ? new URL(ref).hostname : ''; } catch { ref = ''; }
      const v = {
        t: Date.now(),
        country: req.headers['x-vercel-ip-country'] || '',
        city: req.headers['x-vercel-ip-city'] || '',
        device: device(ua),
        path: String(body.path || '#').slice(0, 60),
        ref: ref.slice(0, 80),
      };
      await redis(['LPUSH', LIST, JSON.stringify(v)]);
      await redis(['LTRIM', LIST, '0', '999']);
      return res.status(204).end();
    }
    if (req.method === 'GET') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const raw = (await redis(['LRANGE', LIST, '0', '299'])) || [];
      return res.status(200).json({ visits: raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean) });
    }
    res.setHeader('allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
