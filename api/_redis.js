// Upstash Redis REST 호출 (Vercel Storage에서 Upstash를 연결하면 아래 환경변수가 자동으로 생깁니다)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  if (!URL_ || !TOKEN) throw new Error('storage-not-configured');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('redis-' + r.status);
  return (await r.json()).result;
}

function isAdmin(req) {
  const key = req.headers['x-admin-key'];
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

module.exports = { redis, isAdmin };
