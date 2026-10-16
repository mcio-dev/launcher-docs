import { withBase } from './paths.mjs';

export function buildNavigation(site, pages, resolve) {
  const byRoute = new Map(pages.map(page => [page.route, page]));
  const documents = pages
    .filter(page => page.layout === 'doc' && page.meta.sidebar !== false)
    .sort((left, right) => {
      return (left.meta.order ?? 999) - (right.meta.order ?? 999)
        || left.source.localeCompare(right.source, 'zh-CN');
    });

  function linkItem(page) {
    return { text: page.title, link: page.href };
  }

  function configuredItem(item, source = '站点配置') {
    if (!item || typeof item.text !== 'string') {
      throw new Error(`${source}：导航条目必须包含 text`);
    }

    const result = {
      text: item.text,
      disabled: item.disabled === true,
    };

    if (item.link) {
      result.link = resolve(item.link, { source });
    }

    if (item.children) {
      result.children = item.children.map(child => configuredItem(child, source));
    }

    return result;
  }

  function autoSidebar() {
    const tree = [];

    for (const page of documents) {
      const segments = page.route.split('/').filter(Boolean).slice(0, -1);
      let children = tree;
      let prefix = '';

      for (const segment of segments) {
        prefix += '/' + segment;
        const key = prefix + '/';
        let group = children.find(item => item.key === key);

        if (!group) {
          group = {
            key,
            text: site.groupTitles[key] || byRoute.get(key)?.title || segment,
            children: [],
          };
          children.push(group);
        }

        children = group.children;
      }

      children.push(linkItem(page));
    }

    return tree;
  }

  site.nav = site.nav.map(item => configuredItem(item));

  if (site.sidebar === 'auto' || site.sidebar === true) {
    site.sidebar = autoSidebar();
  } else if (site.sidebar === false) {
    site.sidebar = [];
  } else if (Array.isArray(site.sidebar)) {
    site.sidebar = site.sidebar.map(item => configuredItem(item));
  } else {
    throw new Error('sidebar 必须为 auto、布尔值或导航数组');
  }

  for (const page of pages) {
    page.breadcrumbs = [{ text: '首页', link: withBase(site.base, '/') }];
    const segments = page.route.split('/').filter(Boolean);
    let prefix = '';

    segments.forEach((segment, index) => {
      prefix += '/' + segment;
      const route = prefix + '/';
      const last = index === segments.length - 1;

      page.breadcrumbs.push({
        text: last ? page.title : site.groupTitles[route] || byRoute.get(route)?.title || segment,
        link: !last && byRoute.has(route) ? withBase(site.base, route) : undefined,
      });
    });

    const index = documents.indexOf(page);

    for (const [key, offset] of [['prev', -1], ['next', 1]]) {
      const custom = page.meta[key];
      const neighbor = index >= 0 ? documents[index + offset] : null;

      if (custom === false) {
        page[key] = null;
      } else if (custom) {
        const item = typeof custom === 'string'
          ? { text: key === 'prev' ? '上一篇' : '下一篇', link: custom }
          : custom;
        page[key] = configuredItem(item, page.source);
      } else {
        page[key] = neighbor ? linkItem(neighbor) : null;
      }
    }
  }
}
