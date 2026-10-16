# MCIO Launcher 文档站

基于 Node.js、Vue 3 和 Vite 的静态文档站，正式地址：https://mcl.mcio.dev。

## 开发与构建

需要 Node.js 22.12 或以上版本。

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`，每个页面生成独立 HTML，无需服务端运行环境。修改 `src/node/` 后需重启开发服务。

## 内容与配置

- `docs/`：Markdown 文档，支持 frontmatter、自动侧栏、目录和面包屑。
- `pages/`：Vue 自定义页面，`pages/index.vue` 为产品首页。
- `public/`：公共资源，构建时原样复制；`public/custom.css` 可添加自定义样式。
- `site.config.mjs`：站点信息、导航、页面配置及页脚声明。
- `theme/`：公共组件和样式。

## Markdown frontmatter

frontmatter 是文件最开头、两行 `---` 之间的 YAML 配置，所有字段均可省略。布尔值写作 `true`、`false`，不要加引号；嵌套内容使用空格缩进。

例如 `docs/guide/install.md` 默认对应 `/guide/install/`：

```markdown
---
title: 安装说明
description: 安装与运行要求。
order: 10
sidebar: auto
outline: [2, 3]
breadcrumb: true
navbar: true
layout: doc
---

# 安装说明

正文内容。
```

### 字段用途

| 字段 | 控制什么 | 写法与默认值 |
| --- | --- | --- |
| `title` | 浏览器标签页、文档侧栏、面包屑和上下篇入口中的文章名称。不会替换正文已有的 `# 标题`；正文没有一级标题时，会在文章开头补上这个标题。 | 字符串，如 `title: 安装说明`。省略时取正文第一个一级标题，再回退到路由末段。 |
| `description` | 写入页面元信息的简短摘要，供搜索引擎等读取；不会自动显示为正文中的简介。 | 字符串。默认使用站点描述。 |
| `order` | 文章在自动导航中的先后顺序，以及自动生成的上一篇、下一篇顺序；不是文章内章节的顺序。 | 数字，越小越靠前，默认 `999`；相同时按源文件路径排序。 |
| `sidebar` | 左侧的“文档导航”，用于在不同文章之间切换；不是当前文章的章节目录。 | `auto` 或 `true` 使用站点侧栏；`false` 隐藏本页侧栏，并将本页排除出自动侧栏和自动上下篇。默认使用站点设置。 |
| `outline` | 右侧的“本页目录”，列出当前文章的章节标题，点击后跳转到对应章节。数字表示 Markdown 标题级别，详见下方示例。 | 默认继承站点设置，通常为 `[2, 3]`；`false` 关闭。 |
| `breadcrumb` | 正文上方的路径提示，如“首页 / 使用指南 / 安装说明”，帮助读者判断当前位置并返回上级页面。 | `true` 显示，`false` 隐藏，默认 `true`。 |
| `navbar` | 页面顶部含站点图标、导航链接、主题切换及移动端菜单的整条栏。 | `true` 显示，`false` 隐藏，默认 `true`。 |
| `layout` | 页面的整体排版：普通文档还是展示页面。 | 默认 `doc`，带文档导航；`page` 只保留公共顶部栏、正文和页脚，不显示侧栏、目录、面包屑或上下篇。自定义布局填写 `theme/layouts/` 中 Vue 文件名，不含扩展名。 |
| `permalink` | 文章最终的访问地址，用于让文件改名或移动后仍保持固定 URL；不移动源文件，也不创建旧地址重定向。 | 如 `permalink: /getting-started/`。省略时按文件路径生成；必须以 `/` 开头，不能包含域名、查询参数或锚点，也不能与其他页面冲突。 |
| `draft` | 是否暂不发布这篇文章。 | 默认 `false`；`true` 会跳过页面生成，开发模式也不会显示。它不是访问权限控制。 |
| `prev` / `next` | 文章底部的“上一篇”“下一篇”入口。 | 省略时自动选择；`false` 隐藏对应入口；链接字符串指定目标；`{ text, link }` 同时指定显示文字和目标。 |
| `lang` | HTML 的内容语言，帮助屏幕阅读器和浏览器识别；不会翻译文章或生成多语言版本。 | 如 `lang: zh-CN`，默认使用站点语言。 |
| `head` | 向 HTML 的 `<head>` 添加页面级元信息、样式或脚本；不是正文顶部可见的区域。 | 默认无附加标签；使用 `[标签名, 属性对象, 可选文本]` 数组，示例见下方。 |

### `outline`：哪些章节进入本页目录

Markdown 标题前有几个 `#`，就是几级标题：`#` 是一级，`##` 是二级，`###` 是三级，最多六级。`outline: [2, 3]` 表示**只把二级至三级标题放入目录，包含两端**，不是“显示第 2 至第 3 个标题”。

例如文章内容如下：

```markdown
# 安装说明
## 运行要求
### Java 版本
#### 如何检查 Java
## 安装步骤
### 首次启动
```

配置 `outline: [2, 3]` 后，右侧“本页目录”会显示：

```text
运行要求
  Java 版本
安装步骤
  首次启动
```

- `outline: [2, 2]`：只显示“运行要求”和“安装步骤”两个二级标题，目录更简洁。
- `outline: [2, 4]`：再包含四级标题“如何检查 Java”；选择的是纳入目录的范围，不是规定标题必须出现。
- `outline: false`：不显示本页目录，正文标题仍正常显示。

这个设置**只筛选目录条目，不会删除、改写或重新排序正文标题**。没有符合范围的标题时不显示目录。当前主题仅在宽度超过 1100px 的屏幕显示右侧目录，小屏幕会隐藏；`layout: page` 也不显示它。

### `sidebar` 与 `outline` 的区别

- `sidebar` 管不同文章，例如左侧的“安装说明、使用指南、常见问题”。
- `outline` 管当前文章内部的章节，例如右侧的“运行要求、安装步骤”。
- `sidebar: false` 不会同时关闭 `outline`，反之亦然。两者都不要时分别设为 `false`，或直接使用 `layout: page`。

`sidebar: true` 不会强制开启站点已禁用的侧栏；页面级 `sidebar` 不能填写导航数组，手动分组应在 `site.config.mjs` 配置。隐藏侧栏不等于隐藏文章，页面仍可直接访问；要暂不生成文章应使用 `draft: true`。其他文章链接到草稿时，构建会报失效链接。

### `prev` / `next`：自定义底部阅读入口

下面的片段放在 frontmatter 内，表示不显示“上一篇”，并将“下一篇”指向使用指南：

```yaml
prev: false
next:
  text: 使用指南
  link: /guide/usage/
```

其中 `text` 是按钮上显示的文章名称，`link` 是点击后的访问地址，目标页面必须存在。也可以简写为 `next: /guide/usage/`，此时只显示默认文字“下一篇”，不会自动获取目标文章标题。省略配置时，本站从参与自动导航的文档中选择相邻文章。

### `head`：附加页面元信息

例如给当前文章添加关键词：

```yaml
head:
  - - meta
    - name: keywords
      content: MCIO Launcher,安装
```

外层每一项代表一个标签：第一项 `meta` 是标签名，第二项是属性对象，等价于向 HTML 添加 `<meta name="keywords" content="MCIO Launcher,安装">`。需要多个标签时，再增加一个同级列表项。

支持 `meta`、`link`、`script`、`style`；后两者可用第三项填写标签内文本。页面 `head` 与站点全局 `head` 叠加，不会自动替换同名标签。通常用 `title` 和 `description` 设置标题与摘要即可，不必再手写重复元信息。本地资源使用 `/` 开头的站内路径，例如 `/images/share.png` 对应 `public/images/share.png`；脚本和样式仅应来自可信内容。

额外字段会保留在 `page.meta` 中供自定义 Vue 页面或布局读取，但不会自动产生功能。这里只支持本站列出的选项，不保证兼容 VuePress 的全部配置。Markdown 正文不会执行原始 HTML 或 Vue 组件，需要自定义交互时使用 `pages/`。

## 部署

Cloudflare Pages 构建命令为 `npm run build`，输出目录为 `dist`，Node.js 版本参照 `.node-version`。部署后绑定自定义域名 `mcl.mcio.dev`，无需添加 SPA 回退规则。
