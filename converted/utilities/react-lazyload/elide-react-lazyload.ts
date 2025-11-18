/**
 * React Lazyload - Lazy Load Components
 *
 * Lazy load your components, images or anything else.
 * **POLYGLOT SHOWCASE**: Lazy loading for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-lazyload (~300K+ downloads/week)
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class LazyLoad {
  static render(props: { height?: number; offset?: number; once?: boolean; children?: string }): string {
    return `<div class="lazyload-wrapper" data-height="${props.height || 100}" data-offset="${props.offset || 0}" ${props.once ? 'data-once="true"' : ''}>
  ${props.children || '<div>Loading...</div>'}
</div>`;
  }
}

export function lazyLoadImage(src: string, alt: string = ''): string {
  return `<img class="lazyload" data-src="${src}" alt="${alt}" />`;
}

export default { LazyLoad, lazyLoadImage };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Lazyload - Lazy Loading (POLYGLOT!)\n");
  console.log(LazyLoad.render({ height: 200, children: '<img src="image.jpg" />' }));
  console.log(lazyLoadImage('photo.jpg', 'Lazy loaded image'));
  console.log("\n🚀 ~300K+ downloads/week!");
}
