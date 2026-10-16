import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

function headingText(token) {
  return (token.children || [])
    .filter(child => ['text', 'code_inline', 'image'].includes(child.type))
    .map(child => child.content)
    .join('');
}

function headingSlug(text) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

export function parseMarkdown(source) {
  const parser = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(code, language) {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, {
          language,
          ignoreIllegals: true,
        }).value;
      }

      // 空返回值交由 markdown-it 转义，未知语言仍可正常显示。
      return '';
    },
  });

  const tokens = parser.parse(source, {});
  const headings = [];
  const used = new Set();

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token.type !== 'heading_open') {
      continue;
    }

    const text = headingText(tokens[index + 1]);
    const stem = headingSlug(text);
    let id = stem;
    let suffix = 1;

    while (used.has(id)) {
      id = `${stem}-${suffix}`;
      suffix++;
    }

    used.add(id);
    token.attrSet('id', id);
    headings.push({
      text,
      id,
      level: Number(token.tag.slice(1)),
    });
  }

  return {
    headings,
    render(resolveLink) {
      function visit(token) {
        if (token.type === 'link_open') {
          token.attrSet('href', resolveLink(token.attrGet('href'), false));
        }

        if (token.type === 'image') {
          token.attrSet('src', resolveLink(token.attrGet('src'), true));
          token.attrSet('loading', 'lazy');
        }

        token.children?.forEach(visit);
      }

      tokens.forEach(visit);
      return parser.renderer.render(tokens, parser.options, {});
    },
  };
}
