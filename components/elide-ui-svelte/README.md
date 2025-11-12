# @elide/ui-svelte

Comprehensive Svelte component library for Elide - 50+ production-ready reactive components with TypeScript support and SvelteKit integration.

## Features

- 🎨 **50+ Components** - Complete reactive component library
- ⚡ **Reactive Stores** - Built-in reactive state management
- 📘 **TypeScript** - Full TypeScript support
- ♿ **Accessible** - ARIA-compliant components
- 🎭 **Themeable** - CSS custom properties
- 📱 **Responsive** - Mobile-first design
- 🚀 **SvelteKit Ready** - Optimized for SvelteKit
- 💾 **Tiny Bundle** - Minimal overhead

## Installation

```bash
npm install @elide/ui-svelte
# or
yarn add @elide/ui-svelte
# or
pnpm add @elide/ui-svelte
```

## Quick Start

```svelte
<script>
  import { Button, Input, Modal } from '@elide/ui-svelte';

  let isOpen = false;
  let text = '';
</script>

<Button variant="primary" on:click={() => isOpen = true}>
  Open Modal
</Button>

<Input bind:value={text} placeholder="Enter text..." />

<Modal bind:open={isOpen}>
  <h2 slot="header">Modal Title</h2>
  <p>Modal content goes here</p>
</Modal>
```

## Component Categories (60+ components total)

### Buttons (8 components)
- Button, IconButton, ButtonGroup
- CloseButton, ToggleButton
- FloatingActionButton, SplitButton, LoadingButton

### Inputs (16 components)
- Input, Textarea, Select
- Checkbox, Radio, Switch, Slider
- PinInput, NumberInput, PasswordInput
- SearchInput, DatePicker, TimePicker
- ColorPicker, FileUpload, RangeSlider

### Layout (11 components)
- Box, Flex, Grid, Stack
- Container, Center, Spacer
- Divider, AspectRatio, Wrap, SimpleGrid

### Data Display (12 components)
- Table, Card, Avatar, AvatarGroup
- Badge, Tag, List, Code, Kbd
- Image, Stat, DataList

### Feedback (9 components)
- Alert, Progress, CircularProgress
- Spinner, Skeleton, Toast
- Notification, LoadingOverlay, StatusIndicator

### Navigation (11 components)
- Tabs, Accordion, Menu
- Breadcrumb, Pagination, Stepper
- Dropdown, Link, Navbar
- Sidebar, TreeView

### Overlay (9 components)
- Modal, Drawer, Popover
- Tooltip, Dialog, AlertDialog
- ContextMenu, Sheet, Backdrop

### Forms (8 components)
- Form, FormControl, FormLabel
- FormHelperText, FormErrorMessage
- FieldSet, FormSection, FormActions

## Examples

### Button with Loading State

```svelte
<script>
  import { Button } from '@elide/ui-svelte';

  let loading = false;

  async function handleClick() {
    loading = true;
    await someAsyncAction();
    loading = false;
  }
</script>

<Button {loading} on:click={handleClick}>
  Save Changes
</Button>
```

### Form with Validation

```svelte
<script>
  import { Form, FormControl, Input, FormErrorMessage } from '@elide/ui-svelte';

  let email = '';
  let errors = {};

  function validate() {
    errors = {};
    if (!email) errors.email = 'Email is required';
    return Object.keys(errors).length === 0;
  }
</script>

<Form on:submit={handleSubmit}>
  <FormControl invalid={!!errors.email}>
    <FormLabel>Email</FormLabel>
    <Input bind:value={email} type="email" />
    {#if errors.email}
      <FormErrorMessage>{errors.email}</FormErrorMessage>
    {/if}
  </FormControl>
</Form>
```

### Tabs Component

```svelte
<script>
  import { Tabs, TabList, Tab, TabPanel } from '@elide/ui-svelte';
</script>

<Tabs>
  <TabList>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
    <Tab>Tab 3</Tab>
  </TabList>

  <TabPanel>Content 1</TabPanel>
  <TabPanel>Content 2</TabPanel>
  <TabPanel>Content 3</TabPanel>
</Tabs>
```

### Data Table

```svelte
<script>
  import { Table, Thead, Tbody, Tr, Th, Td } from '@elide/ui-svelte';

  let users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' }
  ];
</script>

<Table variant="striped">
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Email</Th>
      <Th>Role</Th>
    </Tr>
  </Thead>
  <Tbody>
    {#each users as user (user.id)}
      <Tr>
        <Td>{user.name}</Td>
        <Td>{user.email}</Td>
        <Td>{user.role}</Td>
      </Tr>
    {/each}
  </Tbody>
</Table>
```

## Reactive Stores

Built-in stores for state management:

```svelte
<script>
  import { toastStore, modalStore, themeStore } from '@elide/ui-svelte/stores';

  // Show toast
  $toastStore.success('Operation successful!');

  // Open modal
  $modalStore.open('confirmDialog');

  // Toggle theme
  $themeStore.toggle();
</script>
```

Available stores:
- `toastStore` - Toast notifications
- `modalStore` - Modal management
- `themeStore` - Theme switching
- `focusStore` - Focus management
- `breakpointStore` - Responsive breakpoints

## TypeScript Support

All components include TypeScript definitions:

```svelte
<script lang="ts">
  import type { ButtonProps } from '@elide/ui-svelte';

  const buttonProps: ButtonProps = {
    variant: 'primary',
    size: 'md'
  };
</script>
```

## SvelteKit Integration

Perfect integration with SvelteKit:

```typescript
// +page.ts
import type { PageLoad } from './$types';
import { componentStore } from '@elide/ui-svelte/stores';

export const load: PageLoad = async () => {
  // Load component data
  return {
    components: await fetchComponents()
  };
};
```

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines.
