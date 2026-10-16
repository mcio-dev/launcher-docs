import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { loadConfig, validateMeta } from './config.mjs';
import { fileRoute, normalizeRoute, outputFile, slash, walk, withBase } from './paths.mjs';
import { parseMarkdown } from './markdown.mjs';
import { createLinkResolver } from './links.mjs';
import { buildNavigation } from './navigation.mjs';

async function scanPages(root, site) {
  const pages = [];
  const parsed = new Map();

  for (const directory of ['docs', 'pages']) {
    const files = await walk(path.join(root, directory));

    for (const filename of files) {
      const markdown = directory === 'docs' && /\.md$/i.test(filename);
      const vue = directory === 'pages' && filename.endsWith('.vue');

      if (!markdown && !vue) {
        continue;
      }

      const source = slash(path.relative(root, filename));
      const defaultRoute = fileRoute(path.relative(path.join(root, directory), filename));
      const document = markdown ? matter(await fs.readFile(filename, 'utf8')) : null;
      const meta = document ? document.data : site.pages[defaultRoute] || {};
      validateMeta(meta, source);

      if (meta.draft) {
        continue;
      }

      const content = markdown ? parseMarkdown(document.content) : null;
      const headings = content?.headings || [];
      const route = meta.permalink ? normalizeRoute(meta.permalink) : defaultRoute;
      const fallbackTitle = path.posix.basename(route.replace(/\/$/, '')) || site.title;
      const page = {
        source,
        route,
        meta,
        kind: markdown ? 'markdown' : 'vue',
        title: meta.title || headings.find(heading => heading.level === 1)?.text || fallbackTitle,
        description: meta.description ?? site.description,
        layout: meta.layout || 'doc',
        outline: meta.outline ?? site.outline,
        headings,
        href: withBase(site.base, route),
        html: '',
      };

      pages.push(page);

      if (content) {
        parsed.set(page, content);
      }
    }
  }

  pages.push({
    source: '',
    route: '/404/',
    kind: '404',
    title: '页面未找到',
    description: '请求的页面不存在。',
    layout: 'page',
    outline: false,
    headings: [],
    html: '',
    href: withBase(site.base, '/404/'),
    meta: { sidebar: false },
  });

  return { pages, parsed };
}

async function scanAssets(root) {
  const assets = new Map();

  for (const directory of ['docs', 'public']) {
    for (const filename of await walk(path.join(root, directory))) {
      if (directory === 'docs' && /\.md$/i.test(filename)) {
        continue;
      }

      const relative = slash(path.relative(path.join(root, directory), filename));
      const url = directory === 'docs' ? '/_docs/' + relative : '/' + relative;

      if (directory === 'public' && /^\/(?:_assets|_docs)(?:\/|$)/.test(url)) {
        throw new Error(`public 不能使用保留目录：${url}`);
      }

      assets.set(url, filename);
    }
  }

  return assets;
}

function validateOutputs(pages, assets) {
  const routes = new Set();
  const outputs = new Map();

  function claim(filename, source) {
    const key = filename.toLocaleLowerCase('en-US');

    for (const [existing, owner] of outputs) {
      if (key === existing || key.startsWith(existing + '/') || existing.startsWith(key + '/')) {
        throw new Error(`输出冲突：${source} 与 ${owner}`);
      }
    }

    outputs.set(key, source);
  }

  for (const page of pages) {
    if (/^\/(?:_assets|_docs)(?:\/|$)/i.test(page.route) || routes.has(page.route)) {
      throw new Error(`路由冲突或使用保留路径：${page.route}`);
    }

    routes.add(page.route);
    claim(outputFile(page), page.source || '内置 404');
  }

  if (!routes.has('/')) {
    throw new Error('请创建 pages/index.vue 或 docs/index.md 作为首页');
  }

  claim('sitemap.xml', '站点地图');

  for (const url of assets.keys()) {
    claim(url.slice(1), url);
  }
}

export async function collectContent(root, overrides = {}) {
  const site = await loadConfig(root, overrides);
  const { pages, parsed } = await scanPages(root, site);
  const assets = await scanAssets(root);
  validateOutputs(pages, assets);

  const resolve = createLinkResolver(site, pages, assets);

  for (const [page, document] of parsed) {
    page.html = document.render((link, image) => resolve(link, page, image));
  }

  buildNavigation(site, pages, resolve);

  // 样式、脚本和 head 的本地 URL 同样在构建前检查。
  for (const key of ['styles', 'scripts']) {
    site[key] = site[key].map(link => resolve(link, { source: '站点配置' }, true));
  }

  for (const owner of [site, ...pages.map(page => page.meta)]) {
    owner.head = (owner.head || []).map(entry => {
      const [tag, attrs = {}, text = ''] = entry;
      const attributes = { ...attrs };

      for (const key of ['src', 'href']) {
        if (attributes[key]) {
          attributes[key] = resolve(attributes[key], { source: 'head 配置' });
        }
      }

      return [tag, attributes, text];
    });
  }

  return { site, pages, assets };
}
