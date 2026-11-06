---
title: 投稿人名录
description: 为 OpenRef 贡献过条目的投稿人署名。名单由数据文件自动生成，不希望被列入的投稿人可在投稿邮件中注明。
pubDate: 2026-10-28
order: 5
---

本页列出为 OpenRef 贡献过条目的投稿人。**署名按投稿时指定的名字显示，可匿名。**

按[投稿协议](/contribute/agreement/)第四条，提供署名的投稿人默认授权本站公开该署名。若你不希望被列入本页，投稿时在邮件中注明即可，或事后发邮件到 `contact@openref.de5.net` 申请移除。

## 名录

%%AUTHORS_LIST%%

## 怎么加新投稿人

编辑 `src/data/authors.json`，在 `authors` 数组里加一条：

```json
{
  "name": "署名",
  "posts": [
    { "title": "条目标题", "url": "/docs/大类/子类/文件名/", "date": "2026-10-29" }
  ]
}
```

保存后推送，本页自动更新，不需要改 Markdown。

## 相关

- [投稿说明](/contribute/)
- [投稿协议](/contribute/agreement/)
