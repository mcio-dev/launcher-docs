<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

defineProps({
  headings: {
    type: Array,
    required: true,
  },
  minLevel: {
    type: Number,
    default: 2,
  },
});

const activeHeading = ref('');
let observer;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeHeading.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-80px 0px -65% 0px' },
  );

  document.querySelectorAll('.markdown [id]').forEach((element) => {
    observer.observe(element);
  });
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<template>
  <aside
    class="page-toc"
    aria-label="本页目录"
  >
    <div class="toc-heading">本页目录</div>
    <nav>
      <a
        v-for="heading in headings"
        :key="heading.id"
        :href="`#${heading.id}`"
        :class="{
          active: activeHeading === heading.id,
          nested: heading.level > minLevel,
        }"
        :aria-current="activeHeading === heading.id ? 'location' : undefined"
      >
        {{ heading.text }}
      </a>
    </nav>
  </aside>
</template>
