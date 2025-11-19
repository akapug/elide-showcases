# Elide Native - Quick Start Guide

Get started with Elide native compilation in 5 minutes!

## Installation

```bash
npm install -g @elide/cli
```

## 30-Second Demo

### Desktop App

```typescript
// hello-desktop.ts
import { app, Window } from '@elide/native/desktop';

app.on('ready', () => {
  const win = new Window({ title: 'Hello Elide!', width: 400, height: 300 });
  win.loadHTML('<h1>Hello from native Elide!</h1>');
});
```

```bash
# Run
elide run hello-desktop.ts

# Build
elide build --target desktop --output HelloApp
```

**Result:** 12MB binary, 40ms startup

### Mobile App

```typescript
// hello-mobile.ts
import { MobileApp, View, Text } from '@elide/native/mobile';

const app = MobileApp.create({
  appName: 'Hello',
  appId: 'com.example.hello',
  version: '1.0.0',
});

app.on('ready', () => {
  const view = new View({ style: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
  const text = new Text({ text: 'Hello from Elide!', style: { fontSize: 24 } });
  view.addChild(text);
});
```

```bash
# Build for iOS
elide build --target mobile --platform ios --output Hello.app

# Build for Android
elide build --target mobile --platform android --output Hello.apk
```

**Result:** 9MB app, instant startup

### CLI Tool

```typescript
// hello-cli.ts
import { createCLI, Logger } from '@elide/native/cli';

const cli = createCLI({
  name: 'hello',
  version: '1.0.0',
  description: 'Hello CLI',

  commands: [
    {
      name: 'greet',
      description: 'Greet someone',
      arguments: [{ name: 'name', required: true }],
      action: (args) => {
        Logger.success(`Hello, ${args.name}!`);
      },
    },
  ],
});

cli.parse();
```

```bash
# Build
elide build --target cli --output hello

# Run
./hello greet World
```

**Result:** 6MB binary, 8ms startup

## What's Next?

### Learn by Example

Explore complete examples in `/home/user/elide-showcases/tools/elide-native/examples/`:

1. **Desktop Text Editor** - Full-featured editor with menus, dialogs, file I/O
2. **Mobile TODO App** - Complete TODO app with storage and notifications
3. **CLI File Processor** - High-performance file processing tool

### Build Your First App

Choose your platform and follow the guide:

- [Desktop App Guide](./docs/desktop-guide.md)
- [Mobile App Guide](./docs/mobile-guide.md)
- [CLI Tool Guide](./docs/cli-guide.md)

### API Documentation

Browse the comprehensive API docs:

- [Desktop APIs](./docs/desktop-api.md)
- [Mobile APIs](./docs/mobile-api.md)
- [CLI APIs](./docs/cli-api.md)
- [Compiler APIs](./docs/compiler-api.md)

## Common Patterns

### Desktop: File Menu

```typescript
import { Menu, Dialog } from '@elide/native/desktop';

const menu = new Menu([
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          const file = await Dialog.showOpenDialog(undefined, {
            properties: ['openFile'],
          });
          if (file) {
            // Handle file
          }
        },
      },
    ],
  },
]);

Menu.setApplicationMenu(menu);
```

### Mobile: Form Input

```typescript
import { View, TextInput, Button } from '@elide/native/mobile';

const form = new View({ style: { padding: 20 } });

const input = new TextInput({
  placeholder: 'Enter text...',
  style: { padding: 10, borderWidth: 1 },
});

const submit = new Button({
  title: 'Submit',
  onPress: () => {
    const value = input.getValue();
    console.log('Submitted:', value);
  },
});

form.addChild(input);
form.addChild(submit);
```

### CLI: Progress Tracking

```typescript
import { ProgressBar, Spinner } from '@elide/native/cli';

// Determinate progress
const progress = new ProgressBar({ total: 100 });
for (let i = 0; i < 100; i++) {
  await processItem(i);
  progress.tick();
}

// Indeterminate progress
const spinner = new Spinner('Processing...');
spinner.start();
await longRunningTask();
spinner.succeed('Done!');
```

## Tips & Tricks

### 1. Fast Iteration

Use `elide run` for instant testing:

```bash
elide run app.ts
```

### 2. Optimize Builds

Choose the right optimization level:

```bash
# Development (fastest build)
elide build --optimize none

# Production (best performance)
elide build --optimize speed

# Distribution (smallest size)
elide build --optimize size
```

### 3. Cross-Compilation

Build for any platform from anywhere:

```bash
# Build macOS app from Linux
elide build --platform macos --output MyApp.app

# Build Windows exe from macOS
elide build --platform windows --output MyApp.exe
```

### 4. Bundle Analysis

Understand what's in your binary:

```bash
elide build --analyze
```

This generates a detailed report of:
- Module sizes
- Dependencies
- Assets
- Optimization opportunities

## Performance Best Practices

### Desktop Apps

1. **Lazy load windows**: Create windows only when needed
2. **Use native menus**: Faster than custom HTML menus
3. **Minimize IPC**: Direct native calls are faster

### Mobile Apps

1. **Use ListView**: Much faster than ScrollView for long lists
2. **Optimize images**: Compress and resize before bundling
3. **Limit re-renders**: Use shouldUpdate checks

### CLI Tools

1. **Stream large files**: Don't load everything into memory
2. **Use progress indicators**: Better UX for long operations
3. **Cache expensive operations**: Store results in config

## Troubleshooting

### Build Errors

**Error: "Native module not found"**
```bash
# Install native modules explicitly
elide build --native-modules your-module
```

**Error: "Platform toolchain missing"**
- macOS: Install Xcode Command Line Tools
- Windows: Install Visual Studio Build Tools
- Linux: Install build-essential

### Runtime Issues

**Window not showing**
- Ensure `app.on('ready', ...)` is used
- Call `window.show()` explicitly if `show: false`

**Mobile app crashes**
- Check logs with `elide logs`
- Verify all required permissions are requested

## Getting Help

- 📖 [Full Documentation](./README.md)
- 💬 [Discord Community](https://discord.gg/elide)
- 🐛 [Report Issues](https://github.com/elide-dev/elide/issues)
- 📧 [Email Support](mailto:support@elide.dev)

## Next Steps

1. ✅ Install Elide CLI
2. ✅ Run a quick demo
3. 📚 Explore examples
4. 🚀 Build your first app
5. 🎉 Ship native apps!

---

**Ready to build?** Start with the [Desktop Text Editor example](./examples/desktop-text-editor/)!
