import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import App from '../../theme/App.vue';

export function render(payload) {
  const app = createSSRApp(App, payload);
  return renderToString(app);
}
