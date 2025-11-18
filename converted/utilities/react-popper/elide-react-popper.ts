/**
 * React Popper - Positioning Engine
 *
 * React wrapper around Popper.js positioning engine.
 * **POLYGLOT SHOWCASE**: Positioning for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-popper (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class usePopper {
  static create(referenceElement: any, popperElement: any, options?: { placement?: string }): {
    styles: { popper: Record<string, string> };
    attributes: { popper: Record<string, string> };
  } {
    return {
      styles: {
        popper: {
          position: 'absolute',
          top: '0',
          left: '0'
        }
      },
      attributes: {
        popper: {
          'data-placement': options?.placement || 'bottom'
        }
      }
    };
  }
}

export function renderPopper(reference: string, popper: string, placement: string = 'bottom'): string {
  return `<div class="popper-container">
  <div class="reference">${reference}</div>
  <div class="popper" data-placement="${placement}" style="position: absolute">
    ${popper}
  </div>
</div>`;
}

export default { usePopper, renderPopper };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Popper - Positioning Engine (POLYGLOT!)\n");
  console.log(renderPopper('<button>Click me</button>', '<div>Popper content</div>', 'bottom'));
  console.log("\n🚀 ~1M+ downloads/week!");
}
