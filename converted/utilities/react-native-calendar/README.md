# React Native Calendar - Elide Polyglot Showcase

> **One calendar library for ALL languages** - TypeScript, Python, Ruby, and Java

Customizable calendar component for React Native.

## Features

- Calendar views
- Date selection
- Event markers
- Custom styling
- Localization
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { Calendar, Agenda } from './elide-react-native-calendar.ts';

const calendar = new Calendar({
  onDayPress: (day) => console.log(day.dateString),
});

calendar.markDate('2024-01-15', { selected: true });
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-calendar.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-calendars)

---

**Built with ❤️ for the Elide Polyglot Runtime**
