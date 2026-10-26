import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * 分类树 —— 一组一组，每组下面再分子类。
 * 数据写在 taxonomy.json，改那里即可增删分类。
 * scripts/new-post.mjs 读同一份文件，所以建文章时的选项永远和站点一致。
 */
export const taxonomy = JSON.parse(
  fs.readFileSync(path.join(HERE, 'taxonomy.json'), 'utf8')
).categories;

export const categoryMap = new Map(taxonomy.map((c) => [c.id, c]));

export function getCategory(id) {
  return categoryMap.get(id);
}

export function getSub(categoryId, subId) {
  return categoryMap.get(categoryId)?.children.find((s) => s.id === subId) ?? undefined;
}

/** id 或中文名都能解析（容错） */
export function resolveCategory(input) {
  return categoryMap.get(input) ?? taxonomy.find((c) => c.name === input);
}

export function resolveSub(categoryId, input) {
  const cat = categoryMap.get(categoryId);
  if (!cat) return undefined;
  return cat.children.find((s) => s.id === input) ?? cat.children.find((s) => s.name === input);
}

/** 全部分组路径，用于生成静态分类页 */
export function allCategoryPaths() {
  const out = [];
  for (const c of taxonomy) {
    out.push(c.id);
    for (const s of c.children) out.push(`${c.id}/${s.id}`);
  }
  return out;
}
