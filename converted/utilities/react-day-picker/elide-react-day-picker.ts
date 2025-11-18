/**
 * React Day Picker - Date Picker Component
 *
 * Flexible date picker component for React.
 * **POLYGLOT SHOWCASE**: Flexible date picker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-day-picker (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class DayPicker {
  static render(props: { mode?: 'single' | 'multiple' | 'range'; selected?: Date }): string {
    return `<div class="day-picker">
  <input type="date" value="${props.selected ? props.selected.toISOString().split('T')[0] : ''}" />
  ${props.mode === 'multiple' ? '<p>Multiple selection enabled</p>' : ''}
  ${props.mode === 'range' ? '<p>Range selection enabled</p>' : ''}
</div>`;
  }
}

export default DayPicker;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Day Picker - Flexible Date Picker (POLYGLOT!)\n");
  console.log(DayPicker.render({ mode: 'single', selected: new Date() }));
  console.log(DayPicker.render({ mode: 'range' }));
  console.log("\n🚀 ~500K+ downloads/week!");
}
