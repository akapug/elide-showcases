# react-i18next - Elide Polyglot Showcase

> **One React i18n solution for ALL languages** - TypeScript, Python, Ruby, and Java

React integration for i18next with hooks and HOC support.

## Features

- useTranslation hook
- withTranslation HOC
- Trans component for JSX
- Language switching
- Namespace support
- Context provider
- Zero dependencies
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { useTranslation, I18nextProvider } from './elide-react-i18next.ts';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('greeting', { name: 'Alice' })}</p>
      <button onClick={() => i18n.changeLanguage('es')}>
        Switch to Spanish
      </button>
    </div>
  );
}

// Wrap with provider
<I18nextProvider i18n={i18nInstance}>
  <MyComponent />
</I18nextProvider>
```

## Documentation

Run the demo:

```bash
elide run elide-react-i18next.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-i18next)
- [react-i18next Documentation](https://react.i18next.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
