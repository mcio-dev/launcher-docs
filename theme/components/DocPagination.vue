<script setup>
defineProps({
  prev: {
    type: Object,
    default: null,
  },
  next: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <nav
    v-if="prev || next"
    class="pagination"
    aria-label="上下篇"
  >
    <a
      v-if="prev"
      :href="prev.link"
    >
      <span>← 上一篇</span>
      <strong>{{ prev.text }}</strong>
    </a>
    <span v-else></span>
    <a
      v-if="next"
      class="pagination-next"
      :href="next.link"
    >
      <span>下一篇 →</span>
      <strong>{{ next.text }}</strong>
    </a>
  </nav>
</template>
