export default {
  title: 'MCIO Launcher',
  description: '简洁、轻量、可定制的 Minecraft Java 版启动器。',
  lang: 'zh-CN',
  base: '/',

  // 正式域名用于生成 canonical 和 sitemap.xml。
  url: 'https://mcl.mcio.dev',

  nav: [
    {
      text: '首页',
      link: '/',
    },
    {
      text: '源代码',
      link: 'https://github.com/mcio-dev/launcher',
      disabled: true,
    },
  ],

  sidebar: 'auto',
  groupTitles: {},
  outline: [2, 3],

  pages: {
    '/': {
      title: 'MCIO Launcher',
      layout: 'page',
    },
  },

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
    ],
  ],

  styles: ['/custom.css'],
  scripts: [],
  footer: '© 2026-present MrXiaoM. 保留所有权利。',
  disclaimer: '本项目不是 Minecraft 官方产品，与微软公司、Mojang Studios 无从属关系。',
};
