import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeRoute } from './paths.mjs';

export function validateOutline(value, source) {
  if (value === false) {
    return;
  }

  const valid = Array.isArray(value)
    && value.length === 2
    && value.every(level => Number.isInteger(level) && level >= 1 && level <= 6)
    && value[0] <= value[1];

  if (!valid) {
    throw new Error(`${source}：outline 必须为 false 或 [最小标题级别, 最大标题级别]`);
  }
}

export function validateMeta(meta, source) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error(`${source}：frontmatter 必须是对象`);
  }

  const strings = ['title', 'description', 'lang', 'permalink', 'layout'];
  const booleans = ['draft', 'navbar', 'breadcrumb'];

  for (const key of strings) {
    if (meta[key] !== undefined && typeof meta[key] !== 'string') {
      throw new Error(`${source}：${key} 必须是字符串`);
    }
  }

  for (const key of booleans) {
    if (meta[key] !== undefined && typeof meta[key] !== 'boolean') {
      throw new Error(`${source}：${key} 必须是布尔值`);
    }
  }

  if (meta.sidebar !== undefined && ![true, false, 'auto'].includes(meta.sidebar)) {
    throw new Error(`${source}：sidebar 仅支持 true、false 或 auto`);
  }

  if (meta.order !== undefined && !Number.isFinite(meta.order)) {
    throw new Error(`${source}：order 必须是数字`);
  }

  if (meta.outline !== undefined) {
    validateOutline(meta.outline, source);
  }

  for (const key of ['prev', 'next']) {
    const value = meta[key];
    const validObject = value
      && typeof value === 'object'
      && typeof value.text === 'string'
      && typeof value.link === 'string';

    if (value !== undefined && value !== false && typeof value !== 'string' && !validObject) {
      throw new Error(`${source}：${key} 必须为 false、链接字符串或 { text, link }`);
    }
  }

  if (meta.head !== undefined && !Array.isArray(meta.head)) {
    throw new Error(`${source}：head 必须是数组`);
  }
}

export async function loadConfig(root, overrides = {}) {
  const filename = path.join(root, 'site.config.mjs');
  const url = pathToFileURL(filename);
  url.searchParams.set('reload', `${Date.now()}-${Math.random()}`);

  const module = await import(url.href);
  const site = {
    title: '文档',
    description: '',
    lang: 'zh-CN',
    base: '/',
    url: '',
    nav: [],
    sidebar: 'auto',
    groupTitles: {},
    outline: [2, 3],
    pages: {},
    head: [],
    styles: [],
    scripts: [],
    ...module.default,
    ...overrides,
  };

  site.base = normalizeRoute(site.base);
  validateOutline(site.outline, 'site.config.mjs');

  for (const key of ['nav', 'head', 'styles', 'scripts']) {
    if (!Array.isArray(site[key])) {
      throw new Error(`site.config.mjs：${key} 必须是数组`);
    }
  }

  if (site.url) {
    const origin = new URL(site.url);

    if (!['http:', 'https:'].includes(origin.protocol)) {
      throw new Error('site.config.mjs：url 必须使用 http 或 https');
    }
  }

  return site;
}
