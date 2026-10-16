<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const dark = ref(false);
let systemTheme;

function applyTheme(isDark) {
  dark.value = isDark;
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

function toggleTheme() {
  applyTheme(!dark.value);

  try {
    localStorage.setItem('theme', dark.value ? 'dark' : 'light');
  } catch {
    // 存储不可用时，仍保留本次页面内的切换效果。
  }
}

function followSystem(event) {
  try {
    if (localStorage.getItem('theme')) {
      return;
    }
  } catch {
    // 无法读取存储时跟随系统设置。
  }

  applyTheme(event.matches);
}

onMounted(() => {
  dark.value = document.documentElement.dataset.theme === 'dark';
  systemTheme = matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener('change', followSystem);
});

onUnmounted(() => {
  systemTheme?.removeEventListener('change', followSystem);
});
</script>

<template>
  <button
    class="icon-button theme-button"
    type="button"
    aria-label="切换明暗主题"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ dark ? '☀' : '◐' }}</span>
  </button>
</template>
