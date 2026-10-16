<script setup>
defineProps({
  home: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <section class="not-found">
    <span class="eyebrow">404 / 未知坐标</span>
    <h1>这里还没有方块。</h1>
    <p>这个页面不存在，可能已被移动，或链接地址有误。</p>
    <a
      class="button primary"
      :href="home"
    >
      返回首页 →
    </a>
  </section>
</template>
