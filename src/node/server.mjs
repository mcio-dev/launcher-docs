import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import chokidar from 'chokidar';
import { buildSite, projectRoot } from './build.mjs';
import { loadConfig } from './config.mjs';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function statFile(filename) {
  try {
    return await fs.stat(filename);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return null;
    }

    throw error;
  }
}

export function createStaticServer({ directory, base = '/', live = false }) {
  const clients = new Set();
  let currentBase = base;

  function refresh(nextBase) {
    currentBase = nextBase;

    for (const client of clients) {
      client.write('data: reload\n\n');
    }
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);

      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }

      if (live && pathname === '/__site_events') {
        response.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        response.write(': connected\n\n');
        clients.add(response);
        request.on('close', () => clients.delete(response));
        return;
      }

      if (currentBase !== '/' && pathname === currentBase.slice(0, -1)) {
        response.writeHead(308, { Location: encodeURI(currentBase) + url.search });
        response.end();
        return;
      }

      const relativePath = pathname.startsWith(currentBase)
        ? pathname.slice(currentBase.length)
        : pathname.slice(1);
      const segments = relativePath.split('/');
      const hiddenPath = segments.some((segment, index) => {
        const verificationDirectory = index === 0
          && segment === '.well-known'
          && segments.length > 1;

        return segment.startsWith('.') && !verificationDirectory;
      });

      const invalid = pathname.includes('\\')
        || pathname.includes('\0')
        || hiddenPath;

      if (invalid) {
        response.writeHead(400);
        response.end('无效路径');
        return;
      }

      let filename;
      let status = 200;

      if (pathname.startsWith(currentBase)) {
        const relative = pathname.slice(currentBase.length);
        filename = path.join(directory, relative);
        const stat = await statFile(filename);

        if (stat?.isDirectory()) {
          if (!pathname.endsWith('/')) {
            response.writeHead(308, { Location: encodeURI(pathname + '/') + url.search });
            response.end();
            return;
          }

          filename = path.join(filename, 'index.html');
        }
      }

      if (!filename || !(await statFile(filename))?.isFile()) {
        filename = path.join(directory, '404.html');
        status = 404;
      }

      const extension = path.extname(filename).toLowerCase();
      let body = await fs.readFile(filename);

      if (live && extension === '.html') {
        const reloadScript = [
          '<script>',
          "  const updates = new EventSource('/__site_events');",
          "  updates.onmessage = () => location.reload();",
          '</script>',
        ].join('\n');
        body = Buffer.from(body.toString().replace('</body>', reloadScript + '\n</body>'));
      }

      response.writeHead(status, {
        'Content-Type': contentTypes[extension] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      const status = error instanceof URIError ? 400 : 500;
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(status === 400 ? '无效 URL 编码' : '读取静态文件失败');
      console.error(error.message);
    }
  });

  function closeClients() {
    for (const client of clients) {
      client.end();
    }

    clients.clear();
  }

  return { server, refresh, closeClients };
}

export async function startServer({ root = projectRoot, dev = false, port = 4173 } = {}) {
  let site;

  if (dev) {
    ({ site } = await buildSite({ root }));
  } else {
    site = await loadConfig(root);
    await fs.access(path.join(root, 'dist/index.html'));
  }

  const { server, refresh, closeClients } = createStaticServer({
    directory: path.join(root, 'dist'),
    base: site.base,
    live: dev,
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  console.log(`本地${dev ? '开发' : '预览'}：http://localhost:${port}${site.base}`);
  let watcher;
  let timer;
  let building = false;
  let pending = false;

  async function rebuild() {
    if (building) {
      pending = true;
      return;
    }

    building = true;

    try {
      const data = await buildSite({ root });
      refresh(data.site.base);
    } catch (error) {
      console.error(`重建失败，保留上次产物：\n${error.stack || error.message}`);
    } finally {
      building = false;

      if (pending) {
        pending = false;
        await rebuild();
      }
    }
  }

  if (dev) {
    const sources = ['docs', 'pages', 'public', 'theme', 'src', 'site.config.mjs'];
    watcher = chokidar.watch(sources.map(source => path.join(root, source)), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 150 },
    });

    watcher.on('all', () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 100);
    });
  }

  async function stop() {
    clearTimeout(timer);
    await watcher?.close();
    closeClients();
    server.close();
  }

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return { server, stop };
}
