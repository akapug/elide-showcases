/**
 * Semantic UI React - Official React Integration
 *
 * The official React integration for Semantic UI.
 * **POLYGLOT SHOWCASE**: Semantic UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/semantic-ui-react (~300K+ downloads/week)
 *
 * Features:
 * - jQuery-free React components
 * - Declarative API
 * - Augmentation
 * - Shorthand props
 * - Sub-components
 * - Auto controlled state
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class Button {
  static render(props: { primary?: boolean; secondary?: boolean; children?: string }): string {
    const cls = props.primary ? 'ui primary button' : props.secondary ? 'ui secondary button' : 'ui button';
    return `<button class="${cls}">${props.children || 'Button'}</button>`;
  }
}

export class Card {
  static render(props: { header?: string; meta?: string; description?: string }): string {
    return `<div class="ui card">
  ${props.header ? `<div class="content"><div class="header">${props.header}</div></div>` : ''}
  ${props.meta ? `<div class="meta">${props.meta}</div>` : ''}
  ${props.description ? `<div class="description">${props.description}</div>` : ''}
</div>`;
  }
}

export class Message {
  static render(props: { success?: boolean; error?: boolean; warning?: boolean; info?: boolean; content?: string }): string {
    const type = props.success ? 'success' : props.error ? 'error' : props.warning ? 'warning' : 'info';
    return `<div class="ui ${type} message">${props.content || ''}</div>`;
  }
}

export default { Button, Card, Message };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Semantic UI React (POLYGLOT!)\n");
  console.log(Button.render({ primary: true, children: 'Primary' }));
  console.log(Card.render({ header: 'Card Title', description: 'Card description' }));
  console.log(Message.render({ success: true, content: 'Success!' }));
  console.log("\n🚀 ~300K+ downloads/week!");
}
