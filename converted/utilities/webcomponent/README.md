# webcomponent - Web Component Base

Web Component Base

**POLYGLOT SHOWCASE**: One webcomponent implementation for ALL languages on Elide!

Based on [npm:webcomponent](https://www.npmjs.com/package/webcomponent) (~5K+ downloads/week)

## Features

- Minimal component base class
- Standards-based web components
- Framework-agnostic
- Encapsulated styles
- Reusable components
- Zero dependencies

## Quick Start

```typescript
import { defineComponent, html, css } from './elide-webcomponent.ts';

// Define a component
const MyButton = defineComponent({
  tag: 'my-button',
  template: (props) => html`
    <button>${props.label}</button>
  `,
  styles: css`
    button {
      background: blue;
      color: white;
      padding: 10px 20px;
    }
  `,
  props: { label: 'Click me' }
});

// Use in HTML
// <my-button label="Submit"></my-button>
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const MyComponent = defineComponent({
  tag: 'my-component',
  template: (props) => html`<div>${props.content}</div>`
});
```

### Python (via Elide)
```python
# Same component system works in Python!
my_component = define_component({
  "tag": "my-component",
  "template": lambda props: f"<div>{props['content']}</div>"
})
```

### Ruby (via Elide)
```ruby
# Same component system works in Ruby!
my_component = define_component({
  tag: 'my-component',
  template: ->(props) { "<div>#{props[:content]}</div>" }
})
```

## Benefits

- ONE component system across all languages
- Share UI library everywhere
- Consistent behavior across your stack
- Standards-based, framework-agnostic

## Use Cases

- Reusable UI components
- Design systems
- Micro frontends
- Progressive enhancement
- Cross-framework components
