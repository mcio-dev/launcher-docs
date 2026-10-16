import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as viteBuild } from 'vite';
import { collectContent } from './content.mjs';
import { outputFile, walk, withBase } from './paths.mjs';
import { escapeHtml, renderHtml } from './html.mjs';
import { viteConfig } from './vite.mjs';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

function collectStyles(manifest, entry) {
  const styles = new Set();
  const visited = new Set();

  function visit(record) {
    if (!record || visited.has(record.file)) {
      return;
    }

    visited.add(record.file);
    record.css?.forEach(filename => styles.add(filename));
    record.imports?.forEach(key => visit(manifest[key]));
  }

  visit(entry);
  return [...styles];
}

function clientConfig(site) {
  return {
    title: site.title,
    description: site.description,
    base: site.base,
    nav: site.nav,
    sidebar: site.sidebar,
    footer: site.footer,
    disclaimer: site.disclaimer,
  };
}

async function writePages(directory, data, render, manifest) {
  const { site, pages } = data;
  const entry = Object.values(manifest).find(record => record.isEntry);
  const styles = collectStyles(manifest, entry)
    .map(filename => withBase(site.base, filename));

  for (const page of pages) {
    const payload = { site: clientConfig(site), page };
    const app = await render(payload);
    const html = renderHtml({
      site,
      page,
      payload,
      app,
      styles,
      entry: withBase(site.base, entry.file),
    });

    const filename = path.join(directory, outputFile(page));
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, html);
  }
}

async function writeAssets(directory, assets) {
  for (const [url, source] of assets) {
    const filename = path.join(directory, url.slice(1));
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.copyFile(source, filename);
  }
}

async function writeSitemap(directory, site, pages) {
  if (!site.url) {
    return;
  }

  const entries = pages
    .filter(page => page.kind !== '404')
    .map(page => {
      const url = escapeHtml(new URL(page.href, site.url).href);
      return `  <url><loc>${url}</loc></url>`;
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  await fs.writeFile(path.join(directory, 'sitemap.xml'), xml);
}

export async function buildSite({ root = projectRoot, overrides = {} } = {}) {
  const data = await collectContent(root, overrides);
  const layoutFiles = (await walk(path.join(root, 'theme/layouts')))
    .filter(filename => filename.endsWith('.vue'));
  const layouts = new Set(['doc', 'page']);

  for (const filename of layoutFiles) {
    const name = path.basename(filename, '.vue');

    if (layouts.has(name)) {
      throw new Error(`自定义布局名称重复或占用内置名称：${name}`);
    }

    layouts.add(name);
  }

  for (const page of data.pages) {
    if (!layouts.has(page.layout)) {
      throw new Error(`${page.source}：未知布局 ${page.layout}`);
    }
  }

  const cache = path.join(root, '.site-cache');
  const staging = path.join(cache, 'output');
  const serverDirectory = path.join(cache, 'server');
  const output = path.join(root, 'dist');
  const config = viteConfig(root, data.site, data.pages, layoutFiles);

  await fs.rm(cache, { recursive: true, force: true });

  try {
    await viteBuild({
      ...config,
      build: {
        outDir: staging,
        emptyOutDir: true,
        manifest: true,
        assetsDir: '_assets',
        rollupOptions: {
          input: path.join(projectRoot, 'src/client/entry.mjs'),
        },
      },
    });

    await viteBuild({
      ...config,
      build: {
        ssr: path.join(projectRoot, 'src/client/server.mjs'),
        outDir: serverDirectory,
        emptyOutDir: true,
        rollupOptions: {
          output: { entryFileNames: 'entry.mjs' },
        },
      },
    });

    const manifestPath = path.join(staging, '.vite/manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const serverUrl = pathToFileURL(path.join(serverDirectory, 'entry.mjs'));
    serverUrl.searchParams.set('build', `${Date.now()}-${Math.random()}`);
    const { render } = await import(serverUrl.href);

    await writePages(staging, data, render, manifest);
    await writeAssets(staging, data.assets);
    await writeSitemap(staging, data.site, data.pages);
    await fs.rm(path.join(staging, '.vite'), { recursive: true, force: true });

    // 完整构建成功后才替换 dist；内容或编译失败不会清掉上次可用产物。
    await fs.rm(output, { recursive: true, force: true });
    await fs.rename(staging, output);
    console.log(`已生成 ${data.pages.length - 1} 个页面及 404.html → dist`);
    return data;
  } finally {
    await fs.rm(cache, { recursive: true, force: true });
  }
}
