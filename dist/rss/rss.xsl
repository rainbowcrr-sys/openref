<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:openref="https://openref.de5.net/ns/rss/1.0"
  exclude-result-prefixes="atom content openref">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title><xsl:value-of select="/rss/channel/title" /></title>
      <style>
        :root { color-scheme: light dark; }
        body { margin:0; background:#f5f5f7; color:#1d1d1f;
               font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
        .wrap { max-width:780px; margin:0 auto; padding:32px 20px 60px; }
        .top { display:flex; align-items:center; gap:14px; border-bottom:1px solid #d2d2d7; padding-bottom:20px; }
        .top img { width:44px; height:44px; border-radius:10px; flex:0 0 auto; }
        h1 { font-size:24px; margin:0; }
        .hint { margin:18px 0 26px; padding:14px 16px; border-radius:12px;
                background:#fff; border:1px solid #d2d2d7; font-size:14px; }
        .hint code { background:#f0f0f2; padding:2px 6px; border-radius:5px; word-break:break-all; }
        .item { background:#fff; border:1px solid #d2d2d7; border-radius:14px;
                padding:18px 20px; margin-bottom:14px; }
        .item h2 { font-size:18px; margin:0 0 8px; }
        .item h2 a { color:#0071e3; text-decoration:none; }
        .item h2 a:hover { text-decoration:underline; }
        .meta { font-size:13px; color:#6e6e73; margin:0 0 10px; }
        .item p { margin:0; }
        .badge { display:inline-block; color:#fff; font-size:11px; font-weight:600;
                 padding:2px 9px; border-radius:999px; vertical-align:middle; margin-left:8px; }
        .badge-official { background:#0071e3; }
        .badge-contribution { background:#6b7280; }
        footer { margin-top:30px; font-size:13px; color:#6e6e73; }
        footer a { color:#0071e3; }
        @media (prefers-color-scheme: dark) {
          body { background:#000; color:#f5f5f7; }
          .hint, .item { background:#1c1c1e; border-color:#38383a; }
          .hint code { background:#2c2c2e; }
          .meta, footer { color:#98989d; }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="top">
          <img src="https://openref.de5.net/rss/rss-icon.png" alt="RSS" />
          <div>
            <h1><xsl:value-of select="/rss/channel/title" /></h1>
            <div class="meta"><xsl:value-of select="/rss/channel/description" /></div>
          </div>
        </div>
        <div class="hint">
          这是一个 <strong>RSS 订阅源</strong>，不是普通网页。把地址栏里的地址
          <code><xsl:value-of select="/rss/channel/atom:link[@rel='self']/@href" /></code>
          复制到任意 RSS 阅读器即可订阅；阅读器会自动读取里面的文章。
        </div>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2>
              <a href="{link}"><xsl:value-of select="title" /></a>
              <xsl:if test="openref:badge='official'"><span class="badge badge-official">OpenRef OFFICIAL</span></xsl:if>
              <xsl:if test="openref:badge='contribution'"><span class="badge badge-contribution">投稿</span></xsl:if>
            </h2>
            <div class="meta"><xsl:value-of select="pubDate" /></div>
            <p><xsl:value-of select="description" /></p>
          </div>
        </xsl:for-each>
        <footer><a href="https://openref.de5.net/">返回 OpenRef 首页</a> · <a href="https://openref.de5.net/rss/">查看全部订阅地址</a></footer>
      </div>
    </body>
    </html>
  </xsl:template>
</xsl:stylesheet>