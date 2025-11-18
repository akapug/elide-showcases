# @elide/ui-core

Comprehensive React component library for Elide - 100+ production-ready components with TypeScript, accessibility, and theming support.

## Features

- 🎨 **100+ Components** - Comprehensive set of UI components
- 🔥 **TypeScript** - Full TypeScript support with type definitions
- ♿ **Accessible** - WAI-ARIA compliant components
- 🎭 **Themeable** - Customizable theme system
- 📱 **Responsive** - Mobile-first responsive design
- 🎯 **Tree-shakeable** - Import only what you need
- 🪝 **Hooks** - Useful React hooks included
- ⚡ **Fast** - Optimized for performance

## Installation

```bash
npm install @elide/ui-core
# or
yarn add @elide/ui-core
# or
pnpm add @elide/ui-core
```

## Quick Start

```tsx
import { Button, Input, Modal } from '@elide/ui-core';

function App() {
  return (
    <>
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Input placeholder="Enter text..." />
    </>
  );
}
```

## Component Categories

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
- Box, Flex, Grid, Stack (VStack, HStack)
- Container, Center, Spacer
- Divider, AspectRatio, Wrap, SimpleGrid

### Data Display (10+ components)
- Table (Thead, Tbody, Tr, Th, Td)
- Card (CardHeader, CardBody, CardFooter)
- Avatar, AvatarGroup, Badge, Tag
- List, Code, Kbd, Image
- Stat (StatLabel, StatNumber, StatHelpText, StatArrow)

### Feedback (9 components)
- Alert (AlertIcon, AlertTitle, AlertDescription)
- Progress, CircularProgress
- Spinner, Skeleton (SkeletonText, SkeletonCircle)
- Toast

### Navigation (15+ components)
- Tabs (TabList, Tab, TabPanels, TabPanel)
- Accordion (AccordionItem, AccordionButton, AccordionPanel)
- Menu, MenuItem, Breadcrumb, BreadcrumbItem
- Pagination, Stepper, Step
- Dropdown, Link

### Overlay (14+ components)
- Modal (ModalHeader, ModalBody, ModalFooter, ModalOverlay)
- Drawer (DrawerHeader, DrawerBody, DrawerFooter)
- Popover (PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverFooter)
- Tooltip, Dialog, AlertDialog

### Forms (6 components)
- Form, FormControl, FormLabel
- FormHelperText, FormErrorMessage, FieldSet

### Typography (2 components)
- Heading, Text

### Media (7+ components)
- Icon, createIcon, Video
- CheckIcon, CloseIcon, ChevronDownIcon
- SearchIcon, WarningIcon, InfoIcon

## Hooks

- `useDisclosure` - Manage open/close state
- `useBoolean` - Boolean state management
- `useClipboard` - Clipboard operations
- `useMediaQuery` - Responsive design
- `useOutsideClick` - Detect outside clicks
- `useFocusTrap` - Trap focus within element
- `useDebounce` - Debounce values
- `useThrottle` - Throttle function calls
- `useLocalStorage` - Persist state in localStorage
- `useSessionStorage` - Persist state in sessionStorage

## Examples

### Button with Loading State

```tsx
import { Button } from '@elide/ui-core';

<Button loading loadingText="Saving...">
  Save
</Button>
```

### Form with Validation

```tsx
import { FormControl, FormLabel, Input, FormErrorMessage } from '@elide/ui-core';

<FormControl isInvalid={hasError}>
  <FormLabel>Email</FormLabel>
  <Input type="email" placeholder="Enter email" />
  <FormErrorMessage>Email is required</FormErrorMessage>
</FormControl>
```

### Modal Example

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@elide/ui-core';

function Example() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalBody>Modal content goes here</ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

### Data Table

```tsx
import { Table, Thead, Tbody, Tr, Th, Td } from '@elide/ui-core';

<Table variant="striped">
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Email</Th>
      <Th>Role</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>John Doe</Td>
      <Td>john@example.com</Td>
      <Td>Admin</Td>
    </Tr>
  </Tbody>
</Table>
```

### Tabs

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@elide/ui-core';

<Tabs>
  <TabList>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
    <Tab>Tab 3</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Content 1</TabPanel>
    <TabPanel>Content 2</TabPanel>
    <TabPanel>Content 3</TabPanel>
  </TabPanels>
</Tabs>
```

## Theming

```tsx
import { defaultTheme } from '@elide/ui-core';

// Use the default theme or customize it
const customTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: {
      // Your custom colors
    }
  }
};
```

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
import { ButtonProps } from '@elide/ui-core';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Support

For support, please open an issue on GitHub or contact the Elide team.
