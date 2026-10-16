import path from 'node:path';
import { isExternal, normalizeRoute, withBase } from './paths.mjs';

export function createLinkResolver(site, pages, assets) {
  const byRoute = new Map(pages.map(page => [page.route, page]));
  const bySource = new Map(pages.map(page => [page.source, page]));

  function checkHash(page, hash, source) {
    if (!hash || page.kind !== 'markdown') {
      return;
    }

    const id = decodeURIComponent(hash.slice(1));

    if (!page.headings.some(heading => heading.id === id)) {
      throw new Error(`${source}：${page.route} 中不存在锚点 ${hash}`);
    }
  }

  return function resolve(raw, page, image = false) {
    if (!raw || isExternal(raw)) {
      return raw;
    }

    if (raw.startsWith('#')) {
      checkHash(page, raw, page.source);
      return raw;
    }

    const match = raw.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    const pathname = decodeURIComponent(match[1]);
    const query = match[2] || '';
    const hash = match[3] || '';
    let target;
    let resource;

    if (pathname.startsWith('/')) {
      let local = pathname;

      if (site.base !== '/' && local.startsWith(site.base)) {
        local = '/' + local.slice(site.base.length);
      }

      if (/\.md$/i.test(local)) {
        target = bySource.get('docs' + local);
      } else if (!path.posix.extname(local)) {
        target = byRoute.get(normalizeRoute(local));
      } else if (local.endsWith('.html')) {
        const route = local.replace(/(?:index)?\.html$/, '');
        target = byRoute.get(normalizeRoute(route));
      }

      if (assets.has(local)) {
        resource = local;
      }
    } else {
      const source = page.source || 'docs/index.md';
      const relative = path.posix.normalize(
        path.posix.join(path.posix.dirname(source), pathname),
      );

      if (relative.startsWith('../') || !relative.startsWith('docs/')) {
        throw new Error(`${source}：引用越出 docs 目录 ${raw}`);
      }

      target = bySource.get(relative)
        || bySource.get(relative.replace(/\/$/, '') + '/index.md')
        || bySource.get(relative.replace(/\/$/, '') + '/README.md');

      const assetPath = '/_docs/' + relative.slice('docs/'.length);

      if (assets.has(assetPath)) {
        resource = assetPath;
      }
    }

    if (resource) {
      return withBase(site.base, resource) + query + hash;
    }

    if (target && !image) {
      checkHash(target, hash, page.source);
      return withBase(site.base, target.route) + query + hash;
    }

    throw new Error(`${page.source || '站点配置'}：找不到本地引用 ${raw}`);
  };
}
