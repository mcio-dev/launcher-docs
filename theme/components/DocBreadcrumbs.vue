<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <nav
    class="breadcrumbs"
    aria-label="面包屑"
  >
    <template
      v-for="(crumb, index) in items"
      :key="index"
    >
      <span
        v-if="index"
        class="crumb-divider"
        aria-hidden="true"
      >
        /
      </span>
      <a
        v-if="crumb.link"
        :href="crumb.link"
      >
        {{ crumb.text }}
      </a>
      <span
        v-else
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        {{ crumb.text }}
      </span>
    </template>
  </nav>
</template>
