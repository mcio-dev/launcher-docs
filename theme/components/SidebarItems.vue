<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
  current: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <ul class="sidebar-list">
    <li
      v-for="item in items"
      :key="item.key || item.link || item.text"
    >
      <details
        v-if="item.children?.length"
        open
      >
        <summary>{{ item.text }}</summary>
        <a
          v-if="item.link"
          :href="item.link"
          :aria-current="item.link === current ? 'page' : undefined"
        >
          概览
        </a>
        <SidebarItems
          :items="item.children"
          :current="current"
        />
      </details>
      <a
        v-else-if="item.link"
        :href="item.link"
        :class="{ active: item.link === current }"
        :aria-current="item.link === current ? 'page' : undefined"
      >
        {{ item.text }}
      </a>
      <span
        v-else
        class="sidebar-label"
      >
        {{ item.text }}
      </span>
    </li>
  </ul>
</template>
