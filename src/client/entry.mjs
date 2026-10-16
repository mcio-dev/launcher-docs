import { createSSRApp } from 'vue';
import App from '../../theme/App.vue';
import '../../theme/styles/base.css';
import '../../theme/styles/layout.css';
import '../../theme/styles/markdown.css';
import '../../theme/styles/home.css';
import 'highlight.js/styles/github-dark.css';

const dataElement = document.getElementById('site-data');

if (dataElement) {
  const payload = JSON.parse(dataElement.textContent);
  createSSRApp(App, payload).mount('#app');
}
