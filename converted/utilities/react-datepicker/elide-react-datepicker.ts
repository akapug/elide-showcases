/**
 * React Datepicker - Date Picker Component
 *
 * A simple and reusable datepicker component for React.
 * **POLYGLOT SHOWCASE**: Date pickers for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-datepicker (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class DatePicker {
  static render(props: { selected?: Date; placeholderText?: string; dateFormat?: string }): string {
    const value = props.selected ? props.selected.toISOString().split('T')[0] : '';
    return `<input type="date" class="react-datepicker-input" value="${value}" placeholder="${props.placeholderText || 'Select date'}" />`;
  }
}

export default DatePicker;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Datepicker - Date Picker (POLYGLOT!)\n");
  console.log(DatePicker.render({ selected: new Date(), placeholderText: 'Select date' }));
  console.log(DatePicker.render({ placeholderText: 'Choose a date' }));
  console.log("\n🚀 ~1M+ downloads/week!");
}
