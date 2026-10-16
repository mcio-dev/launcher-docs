import fs from 'node:fs/promises';
import path from 'node:path';

export function slash(value) {
  return value.replaceAll('\\', '/');
}

export function isExternal(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
}

export function normalizeRoute(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    throw new Error(`路由必须是以 / 开头的站内路径：${value}`);
  }

  const decoded = decodeURIComponent(value);
  const segments = decoded.split('/').filter(Boolean);

  for (const segment of segments) {
    const invalidCharacter = /[?#\\\0<>:"|*\x01-\x1f]/.test(segment);
    const invalidName = /^(?:con|prn|aux|nul|com\d|lpt\d)(?:\.|$)/i.test(segment);

    if (invalidCharacter || invalidName || /^[. ]+$/.test(segment) || /[. ]$/.test(segment)) {
      throw new Error(`路由包含不安全的路径片段：${value}`);
    }
  }

  return '/' + (segments.length ? segments.join('/') + '/' : '');
}

export function fileRoute(relativeFile) {
  let stem = slash(relativeFile).replace(/\.(?:md|vue)$/i, '');
  stem = stem.replace(/(^|\/)(?:index|readme)$/i, '');
  return normalizeRoute('/' + stem);
}

export function withBase(base, pathname) {
  return encodeURI(base + pathname.replace(/^\//, ''));
}

export function outputFile(page) {
  if (page.kind === '404') {
    return '404.html';
  }

  return page.route.slice(1) + 'index.html';
}

export async function walk(directory) {
  let entries;

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const filename = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`内容目录不支持符号链接：${filename}`);
    }

    if (entry.isDirectory()) {
      files.push(...await walk(filename));
    } else if (entry.isFile()) {
      files.push(filename);
    }
  }

  return files;
}
