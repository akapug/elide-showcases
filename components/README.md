# Elide UI Component Ecosystem

Comprehensive UI component ecosystem for Elide with 300+ production-ready components across 6 specialized libraries.

## 📦 Libraries Overview

### 1. @elide/ui-core (React)
**100+ Components** - Complete React component library

- 8 Button components
- 16 Input components
- 11 Layout components
- 10+ Data Display components
- 9 Feedback components
- 15+ Navigation components
- 14+ Overlay components
- 6 Form components
- 2 Typography components
- 7+ Media components
- 10+ Hooks
- Full TypeScript support
- Accessibility compliant (WAI-ARIA)
- Theming system

**Total: 100+ React components**

### 2. @elide/ui-vue (Vue 3)
**78 Components** - Vue 3 with Composition API

- 8 Button components (EButton, EIconButton, etc.)
- 16 Input components
- 11 Layout components
- 10 Data Display components
- 8 Feedback components
- 10 Navigation components
- 8 Overlay components
- 7 Form components
- Reactive stores
- TypeScript support
- VueUse integration

**Total: 78 Vue 3 components**

### 3. @elide/ui-svelte
**84 Components** - Svelte with reactive stores

- 8 Button components
- 16 Input components
- 11 Layout components
- 12 Data Display components
- 9 Feedback components
- 11 Navigation components
- 9 Overlay components
- 8 Form components
- Reactive state management
- SvelteKit ready
- Minimal bundle size

**Total: 84 Svelte components**

### 4. @elide/charts
**35+ Components** - Data visualization library

#### Chart Types (25)
- **Basic Charts (8):** LineChart, BarChart, PieChart, AreaChart, ScatterChart, RadarChart, PolarChart, FunnelChart
- **Advanced Charts (8):** ComboChart, CandlestickChart, BoxPlotChart, HeatmapChart, TreemapChart, SankeyChart, GaugeChart, WaterfallChart
- **Time Series (3):** TimeSeriesChart, StreamChart, SparklineChart
- **Special Purpose (6):** ProgressChart, ComparisonChart, DistributionChart, NetworkChart, GeoChart, CustomChart

#### Features
- Real-time data streaming
- Interactive tooltips and legends
- Zoom and pan support
- Canvas and SVG rendering
- Export to PNG/SVG/CSV
- Dual Y-axis support
- Custom annotations
- Full theming

**Total: 35+ chart components and utilities**

### 5. @elide/forms
**37+ Components** - Advanced form library

#### Form Builders (5)
- SchemaForm, ZodForm, YupForm, DynamicForm, FormWizard

#### Input Components (12)
- TextInput, EmailInput, PasswordInput, NumberInput, PhoneInput, UrlInput
- DateInput, TimeInput, DateTimeInput, ColorInput, FileInput, RichTextInput

#### Selection Components (6)
- Select, MultiSelect, Autocomplete, RadioGroup, CheckboxGroup, TagInput

#### Advanced Components (7)
- ArrayField, ObjectField, ConditionalField, DependentField, RepeaterField, FileUploader, SignaturePad

#### Features
- Schema-based validation (JSON Schema, Zod, Yup)
- Multi-step wizards
- Dynamic field arrays
- Conditional fields
- Auto-save functionality
- Async validation
- File upload with preview

**Total: 37+ form components and utilities**

### 6. @elide/tables
**40+ Components** - Data table library

#### Table Components (8)
- DataTable, VirtualTable, EditableTable, TreeTable, PivotTable, ResponsiveTable, StickyTable, GroupedTable

#### Column Types (8)
- TextColumn, NumberColumn, DateColumn, BooleanColumn, SelectColumn, TagColumn, ImageColumn, ActionColumn

#### Features (9)
- TableFilter, TableSearch, TablePagination, TableToolbar, ColumnResizer, ColumnReorder, RowSelection, ExportButton, ColumnVisibility

#### Capabilities
- Virtual scrolling for millions of rows
- Server-side pagination
- Inline editing
- Hierarchical data (tree table)
- Row grouping and aggregation
- Export to CSV/Excel/PDF
- Column resizing and reordering
- Mobile responsive
- Sticky headers/columns

**Total: 40+ table components and utilities**

## 🎯 Total Component Count

| Library | Components | Type |
|---------|-----------|------|
| @elide/ui-core | 100+ | React |
| @elide/ui-vue | 78 | Vue 3 |
| @elide/ui-svelte | 84 | Svelte |
| @elide/charts | 35+ | React/Viz |
| @elide/forms | 37+ | React/Forms |
| @elide/tables | 40+ | React/Tables |
| **TOTAL** | **374+** | **All** |

## 📚 Features Across All Libraries

### Common Features
- ✅ **TypeScript** - Full type definitions
- ✅ **Accessibility** - ARIA-compliant
- ✅ **Responsive** - Mobile-first design
- ✅ **Themeable** - Customizable styling
- ✅ **Tree-shakeable** - Import only what you need
- ✅ **Production-ready** - Battle-tested components
- ✅ **Documentation** - Comprehensive README and examples
- ✅ **Test Structure** - Jest/Vitest test files included

### Specialized Features

#### UI Components
- Multiple framework support (React, Vue, Svelte)
- 100+ base UI components
- Layout systems (Flex, Grid, Stack)
- Form controls with validation
- Overlay components (Modal, Drawer, Popover)
- Navigation components
- Feedback components

#### Data Visualization
- 25+ chart types
- Real-time streaming
- Interactive features
- Multiple rendering engines
- Export capabilities

#### Forms
- Schema-based validation
- Multi-step wizards
- Dynamic fields
- File uploads
- Auto-save

#### Tables
- Virtual scrolling
- Inline editing
- Server-side operations
- Export functionality
- Advanced filtering

## 🚀 Quick Start

### Install Libraries

```bash
# Core UI (React)
npm install @elide/ui-core

# Vue 3
npm install @elide/ui-vue

# Svelte
npm install @elide/ui-svelte

# Charts
npm install @elide/charts

# Forms
npm install @elide/forms

# Tables
npm install @elide/tables

# Or install all at once
npm install @elide/ui-core @elide/ui-vue @elide/ui-svelte @elide/charts @elide/forms @elide/tables
```

### Usage Examples

#### React Core UI
```tsx
import { Button, Modal, Input } from '@elide/ui-core';

<Button variant="primary">Click me</Button>
```

#### Vue Components
```vue
<script setup>
import { EButton, EModal } from '@elide/ui-vue';
</script>

<template>
  <EButton variant="primary">Click me</EButton>
</template>
```

#### Svelte Components
```svelte
<script>
  import { Button, Modal } from '@elide/ui-svelte';
</script>

<Button variant="primary">Click me</Button>
```

#### Charts
```tsx
import { LineChart, BarChart } from '@elide/charts';

<LineChart data={data} height={400} />
```

#### Forms
```tsx
import { SchemaForm, FormWizard } from '@elide/forms';

<SchemaForm schema={schema} onSubmit={handleSubmit} />
```

#### Tables
```tsx
import { DataTable, VirtualTable } from '@elide/tables';

<DataTable data={data} columns={columns} sortable filterable />
```

## 📖 Documentation

Each library includes:
- Comprehensive README
- Usage examples
- TypeScript definitions
- Test structure
- Component API documentation

## 🏗️ Architecture

```
/components
├── elide-ui-core/       # React components (100+)
│   ├── src/
│   │   ├── components/  # All UI components
│   │   ├── hooks/       # React hooks
│   │   ├── themes/      # Theme system
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   ├── examples/        # Usage examples
│   ├── __tests__/       # Test files
│   └── README.md
│
├── elide-ui-vue/        # Vue 3 components (78)
│   ├── src/
│   │   ├── components/
│   │   ├── composables/
│   │   └── types/
│   └── README.md
│
├── elide-ui-svelte/     # Svelte components (84)
│   ├── src/lib/
│   │   ├── components/
│   │   ├── stores/
│   │   └── types/
│   └── README.md
│
├── elide-charts/        # Charts (35+)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── themes/
│   │   └── utils/
│   └── README.md
│
├── elide-forms/         # Forms (37+)
│   ├── src/
│   │   ├── components/
│   │   ├── validators/
│   │   ├── schemas/
│   │   └── hooks/
│   └── README.md
│
└── elide-tables/        # Tables (40+)
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    └── README.md
```

## 🎨 Design System

All libraries follow a consistent design system:
- **Colors:** Primary, Secondary, Success, Warning, Danger, Info
- **Sizes:** XS, SM, MD, LG, XL
- **Spacing:** Consistent spacing scale
- **Typography:** Unified font system
- **Breakpoints:** Mobile-first responsive design

## 🧪 Testing

Each library includes:
- Test file structure
- Example test cases
- Jest/Vitest configuration
- Testing utilities

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read individual library contributing guidelines.

## 📞 Support

For support, please:
- Check individual library READMEs
- Open GitHub issues
- Contact Elide team

---

**Built with ❤️ by the Elide Team**
