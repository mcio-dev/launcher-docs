<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

defineProps({
  page: {
    type: Object,
    required: true,
  },
});

const article = ref(null);
const cleanups = [];
const timers = new Set();

function attachCopyButton(pre) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-code';
  button.textContent = '复制';
  button.setAttribute('aria-label', '复制代码');

  async function copyCode() {
    try {
      const code = pre.querySelector('code')?.textContent || '';
      await navigator.clipboard.writeText(code);
      button.textContent = '已复制';
    } catch {
      button.textContent = '复制失败';
    }

    const timer = setTimeout(() => {
      button.textContent = '复制';
      timers.delete(timer);
    }, 1800);

    timers.add(timer);
  }

  button.addEventListener('click', copyCode);
  pre.append(button);
  cleanups.push(() => {
    button.removeEventListener('click', copyCode);
    button.remove();
  });
}

onMounted(() => {
  article.value.querySelectorAll('pre').forEach(attachCopyButton);
});

onUnmounted(() => {
  cleanups.forEach(cleanup => cleanup());
  timers.forEach(timer => clearTimeout(timer));
});
</script>

<template>
  <article
    ref="article"
    class="markdown"
  >
    <h1 v-if="!page.headings.some(heading => heading.level === 1)">
      {{ page.title }}
    </h1>
    <div v-html="page.html"></div>
  </article>
</template>
