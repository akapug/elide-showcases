# @elide/ui-vue

Comprehensive Vue 3 component library for Elide - 50+ production-ready components with Composition API, TypeScript support, and reactive design.

## Features

- 🎨 **50+ Components** - Complete set of UI components for Vue 3
- 🔥 **Composition API** - Built with Vue 3 Composition API
- 📘 **TypeScript** - Full TypeScript support
- ♿ **Accessible** - ARIA-compliant components
- 🎭 **Themeable** - Customizable styling
- 📱 **Responsive** - Mobile-first design
- ⚡ **Fast** - Optimized performance
- 🪝 **VueUse Integration** - Leverages @vueuse/core

## Installation

```bash
npm install @elide/ui-vue
# or
yarn add @elide/ui-vue
# or
pnpm add @elide/ui-vue
```

## Quick Start

```vue
<script setup lang="ts">
import { EButton, EInput, EModal } from '@elide/ui-vue';
import { ref } from 'vue';

const isOpen = ref(false);
</script>

<template>
  <div>
    <EButton variant="primary" @click="isOpen = true">
      Open Modal
    </EButton>

    <EInput v-model="text" placeholder="Enter text..." />

    <EModal v-model="isOpen">
      <template #header>Modal Title</template>
      <template #default>Modal content</template>
    </EModal>
  </div>
</template>
```

## Component Categories

### Buttons (8 components)
- EButton, EIconButton, EButtonGroup
- ECloseButton, EToggleButton
- EFloatingActionButton, ESplitButton, ELoadingButton

### Inputs (16 components)
- EInput, ETextarea, ESelect
- ECheckbox, ERadio, ESwitch, ESlider
- EPinInput, ENumberInput, EPasswordInput
- ESearchInput, EDatePicker, ETimePicker
- EColorPicker, EFileUpload, ERangeSlider

### Layout (11 components)
- EBox, EFlex, EGrid, EStack
- EContainer, ECenter, ESpacer
- EDivider, EAspectRatio, EWrap, ESimpleGrid

### Data Display (15 components)
- ETable, ECard, EAvatar, EAvatarGroup
- EBadge, ETag, EList, ECode, EKbd
- EImage, EStat, EDataList, EDescriptionList

### Feedback (8 components)
- EAlert, EProgress, ECircularProgress
- ESpinner, ESkeleton, EToast, ENotification

### Navigation (12 components)
- ETabs, EAccordion, EMenu
- EBreadcrumb, EPagination, EStepper
- EDropdown, ELink, ENavbar, ESidebar

### Overlay (10 components)
- EModal, EDrawer, EPopover
- ETooltip, EDialog, EAlertDialog
- EContextMenu, ESheet

### Forms (8 components)
- EForm, EFormControl, EFormLabel
- EFormHelperText, EFormErrorMessage
- EFieldSet, EFormSection, EFormActions

## Examples

### Button with Loading

```vue
<script setup>
import { ref } from 'vue';
import { EButton } from '@elide/ui-vue';

const loading = ref(false);

const handleClick = async () => {
  loading.value = true;
  await someAsyncAction();
  loading.value = false;
};
</script>

<template>
  <EButton :loading="loading" @click="handleClick">
    Save Changes
  </EButton>
</template>
```

### Form with Validation

```vue
<script setup>
import { reactive } from 'vue';
import { EForm, EFormControl, EInput, EFormErrorMessage } from '@elide/ui-vue';

const form = reactive({
  email: '',
  errors: {}
});
</script>

<template>
  <EForm @submit="onSubmit">
    <EFormControl :invalid="!!form.errors.email">
      <EFormLabel>Email</EFormLabel>
      <EInput v-model="form.email" type="email" />
      <EFormErrorMessage v-if="form.errors.email">
        {{ form.errors.email }}
      </EFormErrorMessage>
    </EFormControl>
  </EForm>
</template>
```

### Tabs

```vue
<template>
  <ETabs>
    <ETabList>
      <ETab>Tab 1</ETab>
      <ETab>Tab 2</ETab>
      <ETab>Tab 3</ETab>
    </ETabList>
    <ETabPanels>
      <ETabPanel>Content 1</ETabPanel>
      <ETabPanel>Content 2</ETabPanel>
      <ETabPanel>Content 3</ETabPanel>
    </ETabPanels>
  </ETabs>
</template>
```

### Data Table

```vue
<template>
  <ETable>
    <EThead>
      <ETr>
        <ETh>Name</ETh>
        <ETh>Email</ETh>
        <ETh>Role</ETh>
      </ETr>
    </EThead>
    <ETbody>
      <ETr v-for="user in users" :key="user.id">
        <ETd>{{ user.name }}</ETd>
        <ETd>{{ user.email }}</ETd>
        <ETd>{{ user.role }}</ETd>
      </ETr>
    </ETbody>
  </ETable>
</template>
```

## Composables

- `useDisclosure` - Modal/drawer state management
- `useToast` - Toast notifications
- `useClipboard` - Clipboard operations
- `useBreakpoint` - Responsive breakpoints
- `useColorMode` - Dark/light mode
- `useFocusTrap` - Focus management
- `useForm` - Form state management

## TypeScript Support

All components are fully typed:

```vue
<script setup lang="ts">
import type { ButtonProps } from '@elide/ui-vue';

const buttonProps: ButtonProps = {
  variant: 'primary',
  size: 'md'
};
</script>
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.
