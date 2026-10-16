<script setup>
import { computed } from 'vue';
import { components, layouts } from 'virtual:site-components';
import SiteHeader from './components/SiteHeader.vue';
import SidebarItems from './components/SidebarItems.vue';
import DocBreadcrumbs from './components/DocBreadcrumbs.vue';
import DocPagination from './components/DocPagination.vue';
import PageOutline from './components/PageOutline.vue';
import MarkdownContent from './components/MarkdownContent.vue';
import NotFoundPage from './components/NotFoundPage.vue';

const props = defineProps({
  site: {
    type: Object,
    required: true,
  },
  page: {
    type: Object,
    required: true,
  },
});

const pageComponent = computed(() => components[props.page.source]);
const customLayout = computed(() => layouts[props.page.layout]);
const isDocument = computed(() => props.page.layout === 'doc');

const showSidebar = computed(() => {
  return isDocument.value
    && props.page.meta.sidebar !== false
    && props.site.sidebar.length > 0;
});

const headings = computed(() => {
  if (props.page.outline === false) {
    return [];
  }

  const [min, max] = props.page.outline;
  return props.page.headings.filter(heading => heading.level >= min && heading.level <= max);
});

const bodyClasses = computed(() => ({
  'doc-layout': isDocument.value,
  'with-sidebar': showSidebar.value,
  'with-toc': isDocument.value && headings.value.length > 0,
}));
</script>

<template>
  <a
    class="skip-link"
    href="#main-content"
  >
    跳至正文
  </a>

  <SiteHeader
    v-if="page.meta.navbar !== false"
    :site="site"
    :page="page"
    :show-sidebar="showSidebar"
  />

  <main
    v-if="customLayout"
    id="main-content"
    tabindex="-1"
  >
    <component
      :is="customLayout"
      :site="site"
      :page="page"
    >
      <component
        :is="pageComponent"
        v-if="pageComponent"
        :site="site"
        :page="page"
      />
      <MarkdownContent
        v-else
        :page="page"
      />
    </component>
  </main>

  <div
    v-else
    class="site-body"
    :class="bodyClasses"
  >
    <aside
      v-if="showSidebar"
      class="sidebar"
      aria-label="文档导航"
    >
      <div class="sidebar-heading">文档导航</div>
      <SidebarItems
        :items="site.sidebar"
        :current="page.href"
      />
    </aside>

    <main
      id="main-content"
      :class="isDocument ? 'doc-main' : 'page-main'"
      tabindex="-1"
    >
      <NotFoundPage
        v-if="page.kind === '404'"
        :home="site.base"
      />

      <template v-else>
        <DocBreadcrumbs
          v-if="isDocument && page.meta.breadcrumb !== false"
          :items="page.breadcrumbs"
        />
        <component
          :is="pageComponent"
          v-if="pageComponent"
          :site="site"
          :page="page"
        />
        <MarkdownContent
          v-else
          :page="page"
        />
        <DocPagination
          v-if="isDocument"
          :prev="page.prev"
          :next="page.next"
        />
      </template>
    </main>

    <PageOutline
      v-if="isDocument && headings.length"
      :headings="headings"
      :min-level="page.outline[0]"
    />
  </div>

  <footer class="site-footer">
    <p class="footer-copyright">{{ site.footer || site.title }}</p>
    <p
      v-if="site.disclaimer"
      class="footer-disclaimer"
    >
      {{ site.disclaimer }}
    </p>
  </footer>
</template>
