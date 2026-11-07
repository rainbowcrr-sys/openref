/**
 * OpenRef 统计 Worker —— 绑到 stats.openref.de5.net
 *
 * 部署前在 Cloudflare Worker「设置 → 变量」里加三个机密（都勾「加密」）：
 *   GITHUB_TOKEN    细粒度 PAT，只给 openref-stats 仓库 Contents: write
 *   STATS_REPO      rainbowcrr-sys/openref-stats
 *   ALLOWED_ORIGIN  https://openref.de5.net
 *
 * POST /hit     前端上报一次阅读；GET /health 给状态页 ping。
 * 数据写进单独公开仓库的 stats.json / weekly.json，前端从 raw.githubusercontent.com 读。
 * 地区只取 Cloudflare 自带的 CF-IPCountry / CF-Region / CF-IPCity，
 * 最多到国家或城市/州，没有街道级，也不查第三方 IP 库。
 */
const GH = 'https://api.github.com';

function cors(origin, env) {
  const allow = env.ALLOWED_ORIGIN || 'https://openref.de5.net';
  return {
    'Access-Control-Allow-Origin': origin === allow ? allow : allow,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const json = (obj, status, headers) =>
  new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

function gh(env, method, path, body) {
  return fetch(GH + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'openref-stats-worker',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function emptyStats() {
  return {
    total: 0, articles: {}, daily: {}, dailyArticles: {},
    refs: {}, langs: {}, regions: {}, updatedAt: null,
  };
}

async function readFile(env, name) {
  const r = await gh(env, 'GET', `/repos/${env.STATS_REPO}/contents/${name}`);
  if (r.status === 404) return { data: name === 'stats.json' ? emptyStats() : { week: '', top: [] }, sha: null };
  if (!r.ok) throw new Error('read ' + name + ' → ' + r.status);
  const j = await r.json();
  const raw = atob(String(j.content).replace(/\n/g, ''));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  return { data: JSON.parse(new TextDecoder().decode(bytes)), sha: j.sha };
}

async function writeFile(env, name, data, sha) {
  const text = JSON.stringify(data, null, 2) + '\n';
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const body = {
    message: 'chore(stats): 更新 ' + name,
    content: btoa(bin),
    branch: 'main',
  };
  if (sha) body.sha = sha;
  const r = await gh(env, 'PUT', `/repos/${env.STATS_REPO}/contents/${name}`, body);
  if (!r.ok) throw new Error('write ' + name + ' → ' + r.status);
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = t.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil((((t - start) / 86400000) + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}

function last7(now) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function buildWeekly(stats, now) {
  const days = last7(now);
  const sums = {};
  for (const day of days) {
    const m = stats.dailyArticles[day] || {};
    for (const [p, n] of Object.entries(m)) sums[p] = (sums[p] || 0) + n;
  }
  const top = Object.entries(sums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([url, count]) => ({ url, title: (stats.titles && stats.titles[url]) || url, count }));
  return { week: isoWeek(now), generatedAt: now.toISOString(), top };
}

/* 读-改-写 + sha 乐观锁，并发时重试，数字只会单调上涨 */
async function commit(env, mutate) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const cur = await readFile(env, 'stats.json');
    const stats = cur.data;
    const weekly = mutate(stats);
    try {
      await writeFile(env, 'stats.json', stats, cur.sha);
      const w = await readFile(env, 'weekly.json');
      await writeFile(env, 'weekly.json', weekly, w.sha);
      return { ok: true, total: stats.total };
    } catch (e) {
      if (String(e.message).indexOf('409') === -1 && attempt === 3) throw e;
    }
  }
  return { ok: false };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const H = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      let repo = false;
      try {
        const r = await gh(env, 'GET', `/repos/${env.STATS_REPO}`);
        repo = r.ok;
      } catch (e) {}
      return json({ ok: true, worker: true, github: repo, time: new Date().toISOString() }, 200, H);
    }

    if (request.method !== 'POST' || url.pathname !== '/hit') {
      return json({ error: 'not found' }, 404, H);
    }

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400, H); }

    const path = String(body.path || '/').slice(0, 200);
    const title = String(body.title || '').slice(0, 200);
    let ref = '(直接访问)';
    try { if (body.ref) ref = new URL(body.ref).hostname; } catch (e) {}
    const lang = String(body.lang || 'unknown').slice(0, 20);
    const country = request.headers.get('CF-IPCountry') || '';
    const region = request.headers.get('CF-Region') || '';
    const city = request.headers.get('CF-IPCity') || '';
    const now = new Date();
    const day = now.toISOString().slice(0, 10);

    try {
      const res = await commit(env, function (s) {
        s.total = (s.total || 0) + 1;
        s.articles = s.articles || {};
        s.articles[path] = (s.articles[path] || 0) + 1;
        s.daily = s.daily || {};
        s.daily[day] = (s.daily[day] || 0) + 1;
        s.dailyArticles = s.dailyArticles || {};
        s.dailyArticles[day] = s.dailyArticles[day] || {};
        s.dailyArticles[day][path] = (s.dailyArticles[day][path] || 0) + 1;
        s.refs = s.refs || {};
        s.refs[ref] = (s.refs[ref] || 0) + 1;
        s.langs = s.langs || {};
        s.langs[lang] = (s.langs[lang] || 0) + 1;
        s.regions = s.regions || {};
        if (country) {
          const r = s.regions[country] || { count: 0, regions: {}, cities: {} };
          r.count += 1;
          if (region) r.regions[region] = (r.regions[region] || 0) + 1;
          if (city) r.cities[city] = (r.cities[city] || 0) + 1;
          s.regions[country] = r;
        }
        s.titles = s.titles || {};
        if (title) s.titles[path] = title;
        s.updatedAt = now.toISOString();
        return buildWeekly(s, now);
      });
      return json(res, 200, H);
    } catch (e) {
      return json({ ok: false, error: String(e.message || e) }, 500, H);
    }
  },
};
