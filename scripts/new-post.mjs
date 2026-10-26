#!/usr/bin/env node
/**
 * 新建一篇文章。
 *
 * 交互：  npm run new
 * 直接：  npm run new cloud/cloudflare/d1-index
 *        npm run new 编程/Python/venv 用法   ← 中文名也认
 *
 * 作用：在 src/content/docs/<大类>/<子类>/ 下生成带 frontmatter 与正文骨架的 .md。
 * 目录位置决定分类，站点自动归入对应分组，无需改任何配置。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'src/content/docs');
const TAXONOMY = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/taxonomy.json'), 'utf8')
);

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

/* ---------- 分类解析（id 与中文名都接受） ---------- */
function findCategory(key) {
  return TAXONOMY.categories.find((c) => c.id === key || c.name === key);
}
function findSub(cat, key) {
  return cat?.children.find((s) => s.id === key || s.name === key);
}

/* ---------- 正文骨架 ---------- */
function body(title) {
  return [
    '---',
    `title: ${title}`,
    'description: 一句话说明这篇解决什么问题（50–120 字，会作为搜索结果摘要）',
    `pubDate: ${today}`,
    '# updated: ' + today,
    'tags: []',
    'draft: false',
    '# category: cloud      # 默认按目录推断，需要覆盖时才写',
    '# subcategory: cloudflare',
    '---',
    '',
    `一句话定义：${title} 是……（先给结论，再解释）`,
    '',
    '## 适用场景',
    '',
    '- 在什么情况下该用它',
    '- 什么情况下不该用',
    '',
    '## 最小示例',
    '',
    '```js',
    '// 可直接运行的最短代码，带必要上下文',
    '```',
    '',
    '## 说明',
    '',
    '逐条解释上面代码里发生了什么。一段一个意思，不写主观感受。',
    '',
    '## 限制',
    '',
    '- 明确的边界、额度、版本要求',
    '',
    '## 下一步',
    '',
    '- [相关条目](/docs/)',
    '',
  ].join('\n');
}

/* ---------- 写入 ---------- */
function create(catId, subId, slug, title) {
  const dir = path.join(DOCS, catId, subId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.md`);
  if (fs.existsSync(file)) {
    console.error(`\n已存在，未覆盖：${path.relative(ROOT, file)}`);
    process.exit(1);
  }
  fs.writeFileSync(file, body(title), 'utf8');
  return path.relative(ROOT, file);
}

const report = (rel, cat, sub, slug) => {
  console.log(`\n已创建：${rel}`);
  console.log(`分类：${cat.name} › ${sub.name}（自动归入，网站无需改配置）`);
  console.log(`链接：/docs/${cat.id}/${sub.id}/${slug}/`);
  console.log(`\n接下来：打开文件，先写 description，再按骨架填内容。`);
  console.log(`本地预览 node build.mjs --serve，发布：构建后上传 dist/ 里的文件。\n`);
};

/* ---------- 交互式 ---------- */
async function interactive() {
  const rl = readline.createInterface({ input, output });

  console.log('\n选择大类：');
  TAXONOMY.categories.forEach((c, i) => console.log(`  ${i + 1}) ${c.name}  (${c.id})`));
  const ci = Number((await rl.question('序号 > ')).trim()) - 1;
  const cat = TAXONOMY.categories[ci];
  if (!cat) {
    console.error('序号无效');
    rl.close();
    process.exit(1);
  }

  console.log(`\n选择「${cat.name}」下的子类：`);
  cat.children.forEach((s, i) => console.log(`  ${i + 1}) ${s.name}  (${s.id})`));
  const si = Number((await rl.question('序号 > ')).trim()) - 1;
  const sub = cat.children[si];
  if (!sub) {
    console.error('序号无效');
    rl.close();
    process.exit(1);
  }

  let slug = (await rl.question('\n文件名（英文小写+短横线，决定 URL）> ')).trim();
  slug = slug.replace(/\.md$/, '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error('文件名只能用小写字母、数字和短横线，例如 d1-index');
    rl.close();
    process.exit(1);
  }

  const title = (await rl.question('文章标题（中文，显示在页面和搜索结果）> ')).trim() || slug;
  rl.close();

  const rel = create(cat.id, sub.id, slug, title);
  report(rel, cat, sub, slug);
}

/* ---------- 命令行模式 ---------- */
function fromArgs(raw) {
  const parts = raw.replace(/^\/+|\/+$/g, '').replace(/\.md$/, '').split('/');
  if (parts.length !== 3) {
    console.error('路径需形如：大类/子类/文件名，例如 cloud/cloudflare/d1-index');
    process.exit(1);
  }
  const [ck, sk, slug] = parts;
  const cat = findCategory(ck);
  if (!cat) {
    console.error(`未知大类「${ck}」。可选：${TAXONOMY.categories.map((c) => c.id).join(', ')}`);
    process.exit(1);
  }
  const sub = findSub(cat, sk);
  if (!sub) {
    console.error(`未知子类「${sk}」。${cat.name} 下可选：${cat.children.map((s) => s.id).join(', ')}`);
    process.exit(1);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error('文件名只能用小写字母、数字和短横线，例如 d1-index');
    process.exit(1);
  }
  const title = process.argv[3] || slug;
  const rel = create(cat.id, sub.id, slug, title);
  report(rel, cat, sub, slug);
}

const arg = process.argv[2];
if (arg) fromArgs(arg);
else await interactive();
