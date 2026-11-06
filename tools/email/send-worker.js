/**
 * OpenRef 发信 Worker
 *
 * 作用：中转站。前端页面把邮件内容发到这里，
 * 由本 Worker 附上 Resend API Key（密钥藏在服务端，浏览器看不到），
 * 再转发给 Resend 真正投递。
 *
 * 需要配置的环境变量（Cloudflare Worker → Settings → Variables and Secrets）：
 *   RESEND_API_KEY  必填  Resend 的 API Key（re_ 开头）
 *   FROM_ADDRESS    选填  默认 "OpenRef 编辑部 <no-reply@openref.de5.net>"
 *   SEND_SECRET     选填  调用口令，防别人冒用你的接口（强烈建议设置）
 *   ALLOW_ORIGIN    选填  允许访问的页面地址，默认 "*"
 */

const DEFAULT_FROM = 'OpenRef 编辑部 <no-reply@openref.de5.net>';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8' },
      corsHeaders(origin)
    ),
  });
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json({ error: '只接受 POST 请求' }, 405, origin);
    }

    if (!env.RESEND_API_KEY) {
      return json({ error: 'Worker 未配置 RESEND_API_KEY' }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: '请求体不是合法 JSON' }, 400, origin);
    }

    const { to, subject, html, text, secret } = body;

    // 口令校验：设了 SEND_SECRET 就必须对上，否则任何人都能拿你的接口发信
    if (env.SEND_SECRET && secret !== env.SEND_SECRET) {
      return json({ error: '口令错误' }, 401, origin);
    }

    if (!to || !subject) {
      return json({ error: '缺少收件人或主题' }, 400, origin);
    }

    const payload = {
      from: env.FROM_ADDRESS || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
    };
    if (text) payload.text = text;
    if (html) payload.html = html;

    let upstream;
    try {
      upstream = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      return json({ error: '无法连接 Resend：' + e.message }, 502, origin);
    }

    let data;
    try {
      data = await upstream.json();
    } catch (e) {
      data = { raw: await upstream.text() };
    }

    if (!upstream.ok) {
      return json(
        { error: 'Resend 返回错误', status: upstream.status, detail: data },
        upstream.status,
        origin
      );
    }

    return json({ ok: true, id: data.id }, 200, origin);
  },
};
