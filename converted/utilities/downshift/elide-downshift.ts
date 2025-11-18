/**
 * Downshift - Primitive for Building Autocomplete/Dropdown/Select
 *
 * Primitives to build simple, flexible, WAI-ARIA compliant enhanced input React components.
 * **POLYGLOT SHOWCASE**: Autocomplete primitives for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/downshift (~300K+ downloads/week)
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class Downshift {
  static render(props: { items: string[]; placeholder?: string }): string {
    return `<div class="downshift">
  <input placeholder="${props.placeholder || 'Type to search...'}" list="items" />
  <datalist id="items">
${props.items.map(item => `    <option value="${item}">`).join('\n')}
  </datalist>
</div>`;
  }
}

export class useCombobox {
  static create(options: { items: string[] }): { items: string[] } {
    return { items: options.items };
  }
}

export default { Downshift, useCombobox };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Downshift - Autocomplete Primitives (POLYGLOT!)\n");
  console.log(Downshift.render({ items: ['Apple', 'Banana', 'Cherry'], placeholder: 'Search fruits...' }));
  console.log("\n🚀 ~300K+ downloads/week!");
}
