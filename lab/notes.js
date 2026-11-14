// 인사이트 메모: GET = 누구나 읽기, POST = 편집 키(ADMIN_KEY)가 있을 때만 저장
const { redis, isAdmin } = require('./_redis');
const HASH = 'lab:notes';

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  try {
    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', HASH])) || [];
      const notes = {};
      for (let i = 0; i < flat.length; i += 2) notes[flat[i]] = flat[i + 1];
      return res.status(200).json({ notes });
    }
    if (req.method === 'POST') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (body.check) return res.status(200).json({ ok: true });
      const key = String(body.key || '');
      // 'ws:v1' = /lab/ 워크스페이스 전체(JSON)라서 길이를 넉넉히, 나머지 메모는 12000자
      const limit = key === 'ws:v1' ? 400000 : 12000;
      const value = String(body.value ?? '').slice(0, limit);
      if (!/^[a-z0-9:_-]{1,60}$/i.test(key)) return res.status(400).json({ error: 'bad-key' });
      if (value.trim()) await redis(['HSET', HASH, key, value]);
      else await redis(['HDEL', HASH, key]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
