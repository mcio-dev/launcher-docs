<script setup>
import { onUnmounted, ref, watch } from 'vue';
import SidebarItems from './SidebarItems.vue';
import ThemeToggle from './ThemeToggle.vue';

const props = defineProps({
  site: {
    type: Object,
    required: true,
  },
  page: {
    type: Object,
    required: true,
  },
  showSidebar: {
    type: Boolean,
    default: false,
  },
});

const menuOpen = ref(false);
const menuButton = ref(null);
const mobileMenu = ref(null);

function closeMenu() {
  menuOpen.value = false;
  menuButton.value?.focus();
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeMenu();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const links = mobileMenu.value?.querySelectorAll('a[href], summary');
  const first = links?.[0];
  const last = links?.[links.length - 1];
  const focused = document.activeElement;

  if (event.shiftKey && (focused === first || focused === menuButton.value)) {
    event.preventDefault();
    (focused === first ? menuButton.value : last)?.focus();
  } else if (!event.shiftKey && focused === last) {
    event.preventDefault();
    menuButton.value?.focus();
  }
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('menu-open', open);

  if (open) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  document.body.classList.remove('menu-open');
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <a
        class="brand"
        :href="props.site.base"
      >
        <img
          class="brand-logo"
          :src="site.base + 'favicon.svg'"
          alt=""
          width="30"
          height="30"
        >
        <span>{{ site.title }}</span>
        <span class="brand-tag">文档</span>
      </a>

      <nav
        class="top-nav"
        aria-label="顶部导航"
      >
        <a
          v-for="item in site.nav"
          :key="item.link"
          :href="item.disabled ? undefined : item.link"
          :role="item.disabled ? 'link' : undefined"
          :aria-disabled="item.disabled || undefined"
          :tabindex="item.disabled ? -1 : undefined"
          :title="item.disabled ? '暂未开放' : undefined"
          :aria-current="!item.disabled && item.link === page.href ? 'page' : undefined"
        >
          {{ item.text }}
          <span
            v-if="/^https?:/.test(item.link)"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      </nav>

      <div class="header-controls">
        <ThemeToggle />
        <button
          ref="menuButton"
          class="icon-button mobile-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="mobile-navigation"
          :aria-label="menuOpen ? '关闭导航' : '打开导航'"
          @click="menuOpen = !menuOpen"
        >
          <span aria-hidden="true">{{ menuOpen ? '×' : '☰' }}</span>
        </button>
      </div>
    </div>
  </header>

  <template v-if="menuOpen">
    <div
      class="menu-backdrop"
      @click="closeMenu"
    ></div>
    <nav
      id="mobile-navigation"
      ref="mobileMenu"
      class="mobile-navigation"
      aria-label="移动端导航"
    >
      <a
        v-for="item in site.nav"
        :key="item.link"
        :href="item.disabled ? undefined : item.link"
        :role="item.disabled ? 'link' : undefined"
        :aria-disabled="item.disabled || undefined"
        :tabindex="item.disabled ? -1 : undefined"
        :title="item.disabled ? '暂未开放' : undefined"
      >
        {{ item.text }}
      </a>
      <SidebarItems
        v-if="showSidebar"
        :items="site.sidebar"
        :current="page.href"
      />
    </nav>
  </template>
</template>
