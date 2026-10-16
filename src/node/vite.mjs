import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { slash } from './paths.mjs';

function componentRegistry(root, pages, layoutFiles) {
  const virtualId = 'virtual:site-components';
  const resolvedId = '\0' + virtualId;

  return {
    name: 'site-component-registry',

    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }
    },

    load(id) {
      if (id !== resolvedId) {
        return;
      }

      const imports = [];
      const components = [];
      const layouts = [];

      pages.filter(page => page.kind === 'vue').forEach((page, index) => {
        const filename = slash(path.resolve(root, page.source));
        const identifier = `Page${index}`;
        imports.push(`import ${identifier} from ${JSON.stringify(filename)};`);
        components.push(`  ${JSON.stringify(page.source)}: ${identifier}`);
      });

      layoutFiles.forEach((filename, index) => {
        const name = path.basename(filename, '.vue');
        const identifier = `Layout${index}`;
        imports.push(`import ${identifier} from ${JSON.stringify(slash(filename))};`);
        layouts.push(`  ${JSON.stringify(name)}: ${identifier}`);
      });

      return [
        ...imports,
        `export const components = {\n${components.join(',\n')}\n};`,
        `export const layouts = {\n${layouts.join(',\n')}\n};`,
      ].join('\n');
    },
  };
}

export function viteConfig(root, site, pages, layoutFiles) {
  return {
    configFile: false,
    root,
    base: site.base,
    publicDir: false,
    logLevel: 'warn',
    resolve: {
      dedupe: ['vue'],
    },
    plugins: [
      vue(),
      componentRegistry(root, pages, layoutFiles),
    ],
  };
}
