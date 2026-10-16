<script setup>
defineProps({
  site: {
    type: Object,
    required: true,
  },
});

// 正式开放后改为 false，即可恢复原先的项目与反馈链接。
const projectLinksDisabled = true;

const features = [
  {
    number: '01',
    title: '游戏，有条不紊',
    description: '原版下载安装、多游戏目录与实例隔离，让每个世界拥有独立的启动设置。',
  },
  {
    number: '02',
    title: '轻巧，也有个性',
    description: 'Rust 与 Slint 原生界面，不依赖 WebView。浅深主题与自定义配色，适合你的使用习惯。',
  },
  {
    number: '03',
    title: '过程，清晰可见',
    description: '并发下载、完整性校验与独立日志窗口，让准备与启动的每一步都有迹可循。',
  },
];
</script>

<template>
  <section class="hero">
    <div class="hero-content">
      <span class="eyebrow">
        <span class="status-dot"></span>
        MCIO LAUNCHER
      </span>
      <h1>
        你的世界，<br>
        <span>轻装启程。</span>
      </h1>
      <p class="hero-description">
        简洁、轻量、可定制的 Minecraft Java 版启动器。<br class="desktop-break">
        少一点繁琐，多一点属于游戏的时间。
      </p>
      <div class="hero-actions">
        <a
          class="button primary"
          :href="projectLinksDisabled ? undefined : 'https://github.com/mcio-dev/launcher'"
          role="link"
          :aria-disabled="projectLinksDisabled || undefined"
          :tabindex="projectLinksDisabled ? -1 : undefined"
          :title="projectLinksDisabled ? '项目尚未正式开源，暂未开放' : undefined"
        >
          查看开源项目
          <span aria-hidden="true">↗</span>
        </a>
        <a
          class="button secondary"
          :href="projectLinksDisabled ? undefined : 'https://github.com/mcio-dev/launcher/issues'"
          role="link"
          :aria-disabled="projectLinksDisabled || undefined"
          :tabindex="projectLinksDisabled ? -1 : undefined"
          :title="projectLinksDisabled ? '反馈入口暂未开放' : undefined"
        >
          反馈问题
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <p class="hero-note">原生桌面体验 · 自由定制 · 持续开发中</p>
      <p
        v-if="projectLinksDisabled"
        class="availability-note"
      >
        项目尚未正式开源，以上入口暂未开放。
      </p>
    </div>

    <figure class="hero-preview">
      <img
        class="launcher-screenshot"
        :src="site.base + 'images/launcher-window.png'"
        alt="MCIO Launcher 软件截图：原生桌面窗口包含开始游戏、游戏库、获取游戏和设置入口。"
        width="920"
        height="660"
        fetchpriority="high"
        decoding="async"
      >
      <figcaption>MCIO Launcher · 开发中的软件界面</figcaption>
    </figure>
  </section>

  <section
    class="feature-grid"
    aria-label="项目特点"
  >
    <article
      v-for="feature in features"
      :key="feature.number"
      class="feature-card"
    >
      <span class="feature-number">{{ feature.number }} / FEATURE</span>
      <h2>{{ feature.title }}</h2>
      <p>{{ feature.description }}</p>
    </article>
  </section>

  <aside class="development-notice">
    <span
      class="notice-icon"
      aria-hidden="true"
    >
      i
    </span>
    <div>
      <strong>还在成长，欢迎一起打磨。</strong>
      <p>
        项目仍处于开发阶段，尚不是稳定发布版。Microsoft／外置账号认证、
        加载器与整合包安装、资源探索仍在开发。
      </p>
    </div>
  </aside>
</template>
