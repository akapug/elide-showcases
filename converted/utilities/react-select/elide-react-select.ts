/**
 * React Select - Flexible Select Component
 *
 * A flexible and beautiful Select Input control for ReactJS.
 * **POLYGLOT SHOWCASE**: Select component for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-select (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

interface Option {
  value: string;
  label: string;
}

export class Select {
  static render(props: { options: Option[]; placeholder?: string; isMulti?: boolean }): string {
    return `<select class="react-select" ${props.isMulti ? 'multiple' : ''}>
  <option value="">${props.placeholder || 'Select...'}</option>
${props.options.map(opt => `  <option value="${opt.value}">${opt.label}</option>`).join('\n')}
</select>`;
  }
}

export default Select;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Select - Flexible Select (POLYGLOT!)\n");
  console.log(Select.render({
    options: [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' }
    ],
    placeholder: 'Choose a color...'
  }));
  console.log("\n🚀 ~2M+ downloads/week!");
}
