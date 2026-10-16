export function escapeHtml(value) {
  const replacements = {
    '&': '\u0026amp;',
    '<': '\u0026lt;',
    '>': '\u0026gt;',
    '"': '\u0026quot;',
    "'": '\u0026#39;',
  };

  return String(value).replace(/[&<>"']/g, character => replacements[character]);
}

function serialize(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function renderHead(entries) {
  return entries.map(([tag, attributes = {}, text = '']) => {
    if (!['meta', 'link', 'script', 'style'].includes(tag)) {
      throw new Error(`head 不支持标签：${tag}`);
    }

    const attrs = Object.entries(attributes).map(([key, value]) => {
      if (!/^[a-zA-Z][\w:-]*$/.test(key)) {
        throw new Error(`head 属性名无效：${key}`);
      }

      return ` ${key}="${escapeHtml(value)}"`;
    }).join('');

    if (tag === 'meta' || tag === 'link') {
      return `<${tag}${attrs}>`;
    }

    if (new RegExp(`</${tag}`, 'i').test(text)) {
      throw new Error(`head 的 ${tag} 文本不得包含结束标签`);
    }

    return `<${tag}${attrs}>${text}</${tag}>`;
  }).join('\n');
}

export function renderHtml({ site, page, app, payload, styles, entry }) {
  const title = page.route === '/' ? site.title : `${page.title} | ${site.title}`;
  const canonical = site.url && page.kind !== '404'
    ? new URL(page.href, site.url).href
    : '';

  const stylesheetTags = [...styles, ...site.styles]
    .map(url => `<link rel="stylesheet" href="${escapeHtml(url)}">`)
    .join('\n');

  const scriptTags = site.scripts
    .map(url => `<script defer src="${escapeHtml(url)}"></script>`)
    .join('\n');

  // 主题在绘制前初始化，避免刷新时闪烁。
  const themeScript = [
    "try {",
    "  const saved = localStorage.getItem('theme');",
    "  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;",
    "  const theme = saved === 'dark' || saved === 'light' ? saved : systemDark ? 'dark' : 'light';",
    "  document.documentElement.dataset.theme = theme;",
    "} catch {}",
  ].join('\n');

  return `<!doctype html>
<html lang="${escapeHtml(page.meta.lang || site.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="color-scheme" content="light dark">
  ${page.kind === '404' ? '<meta name="robots" content="noindex">' : ''}
  ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
  <script>
${themeScript}
  </script>
${stylesheetTags}
${renderHead(site.head)}
${renderHead(page.meta.head || [])}
</head>
<body>
  <div id="app">${app}</div>
  <script type="application/json" id="site-data">${serialize(payload)}</script>
  <script type="module" src="${escapeHtml(entry)}"></script>
${scriptTags}
</body>
</html>
`;
}
