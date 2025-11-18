# @elide/tables

Advanced data table library for Elide - Build powerful data grids with sorting, filtering, pagination, virtual scrolling, and more.

## Features

- 📊 **Data Grid** - Feature-rich table component
- 🔍 **Filtering** - Global and column-level filters
- 🔄 **Sorting** - Single and multi-column sorting
- 📄 **Pagination** - Client and server-side pagination
- ⚡ **Virtual Scrolling** - Handle millions of rows
- 📝 **Inline Editing** - Editable cells and rows
- 🎨 **Customizable** - Full styling control
- 📤 **Export** - CSV, Excel, PDF export
- 🔥 **TypeScript** - Complete type safety
- 📱 **Responsive** - Mobile-friendly tables

## Installation

```bash
npm install @elide/tables
# or
yarn add @elide/tables
# or
pnpm add @elide/tables
```

## Component Categories (25+ components)

### Table Components (8)
- DataTable - Main table component
- VirtualTable - Virtual scrolling table
- EditableTable - Inline editable table
- TreeTable - Hierarchical tree table
- PivotTable - Pivot/crosstab table
- ResponsiveTable - Mobile responsive table
- StickyTable - Sticky headers/columns
- GroupedTable - Row grouping table

### Column Types (8)
- TextColumn, NumberColumn, DateColumn
- BooleanColumn, SelectColumn, TagColumn
- ImageColumn, ActionColumn

### Features (9)
- TableFilter - Filter controls
- TableSearch - Global search
- TablePagination - Pagination controls
- TableToolbar - Action toolbar
- ColumnResizer - Resize columns
- ColumnReorder - Drag-drop reorder
- RowSelection - Multi-select rows
- ExportButton - Export data
- ColumnVisibility - Show/hide columns

## Quick Start

### Basic Table

```tsx
import { DataTable } from '@elide/tables';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
];

const columns = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'age', header: 'Age', accessor: 'age', type: 'number' }
];

function App() {
  return (
    <DataTable
      data={data}
      columns={columns}
      sortable
      filterable
      paginated
      pageSize={10}
    />
  );
}
```

### Advanced Table with All Features

```tsx
import {
  DataTable,
  TableToolbar,
  TableSearch,
  TableFilter,
  ExportButton,
  ColumnVisibility
} from '@elide/tables';

function AdvancedTable() {
  const [data, setData] = useState(initialData);
  const [selectedRows, setSelectedRows] = useState([]);

  const columns = [
    {
      id: 'select',
      type: 'checkbox',
      width: 50
    },
    {
      id: 'id',
      header: 'ID',
      accessor: 'id',
      sortable: true,
      filterable: true
    },
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
      cell: ({ value, row }) => (
        <a href={`/users/${row.id}`}>{value}</a>
      )
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
      filterable: true
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      type: 'select',
      options: ['Admin', 'User', 'Guest'],
      sortable: true,
      filterable: true
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      type: 'tag',
      colorMap: {
        active: 'green',
        inactive: 'gray',
        pending: 'yellow'
      }
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessor: 'createdAt',
      type: 'date',
      sortable: true,
      filterable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      width: 100,
      cell: ({ row }) => (
        <>
          <button onClick={() => handleEdit(row)}>Edit</button>
          <button onClick={() => handleDelete(row)}>Delete</button>
        </>
      )
    }
  ];

  return (
    <>
      <TableToolbar>
        <TableSearch placeholder="Search all columns..." />
        <TableFilter columns={columns} />
        <ColumnVisibility columns={columns} />
        <ExportButton data={data} filename="users.csv" />
      </TableToolbar>

      <DataTable
        data={data}
        columns={columns}
        sortable
        multiSort
        filterable
        paginated
        pageSize={20}
        rowSelection
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        stickyHeader
        columnResizing
        columnReordering
        loading={loading}
        emptyState={<EmptyState />}
      />
    </>
  );
}
```

### Virtual Scrolling Table

```tsx
import { VirtualTable } from '@elide/tables';

function LargeDataTable() {
  // Handle millions of rows efficiently
  const data = generateLargeDataset(1000000);

  return (
    <VirtualTable
      data={data}
      columns={columns}
      height={600}
      rowHeight={50}
      overscan={10}
      sortable
    />
  );
}
```

### Editable Table

```tsx
import { EditableTable } from '@elide/tables';

function EditableDataTable() {
  const [data, setData] = useState(initialData);

  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      editable: true,
      editType: 'text'
    },
    {
      id: 'age',
      header: 'Age',
      accessor: 'age',
      editable: true,
      editType: 'number',
      validation: (value) => value > 0 && value < 150
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
      editable: true,
      editType: 'email'
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      editable: true,
      editType: 'select',
      options: ['Admin', 'User', 'Guest']
    }
  ];

  const handleCellEdit = (rowIndex, columnId, value) => {
    const newData = [...data];
    newData[rowIndex][columnId] = value;
    setData(newData);
  };

  return (
    <EditableTable
      data={data}
      columns={columns}
      onCellEdit={handleCellEdit}
      onRowAdd={(newRow) => setData([...data, newRow])}
      onRowDelete={(rowIndex) => setData(data.filter((_, i) => i !== rowIndex))}
    />
  );
}
```

### Tree Table

```tsx
import { TreeTable } from '@elide/tables';

const hierarchicalData = [
  {
    id: 1,
    name: 'Parent 1',
    children: [
      { id: 2, name: 'Child 1.1' },
      {
        id: 3,
        name: 'Child 1.2',
        children: [
          { id: 4, name: 'Grandchild 1.2.1' }
        ]
      }
    ]
  }
];

<TreeTable
  data={hierarchicalData}
  columns={columns}
  expandable
  defaultExpanded={[1, 3]}
  onRowExpand={(row) => console.log('Expanded:', row)}
/>
```

### Server-Side Table

```tsx
import { DataTable } from '@elide/tables';

function ServerSideTable() {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async ({ page, pageSize, sortBy, filters }) => {
    setLoading(true);
    const response = await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ page, pageSize, sortBy, filters })
    });
    const result = await response.json();
    setData(result.data);
    setTotalRows(result.total);
    setLoading(false);
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      serverSide
      totalRows={totalRows}
      loading={loading}
      onFetchData={fetchData}
      paginated
      sortable
      filterable
    />
  );
}
```

### Grouped Table

```tsx
import { GroupedTable } from '@elide/tables';

<GroupedTable
  data={data}
  columns={columns}
  groupBy="category"
  aggregations={{
    revenue: 'sum',
    count: 'count',
    avgPrice: 'average'
  }}
  expandable
/>
```

### Responsive Table

```tsx
import { ResponsiveTable } from '@elide/tables';

<ResponsiveTable
  data={data}
  columns={columns}
  breakpoint="md"
  mobileLayout="cards" // or "stacked"
/>
```

### Export Data

```tsx
import { useTableExport } from '@elide/tables';

function ExportExample() {
  const { exportToCSV, exportToExcel, exportToPDF } = useTableExport();

  return (
    <>
      <button onClick={() => exportToCSV(data, 'data.csv')}>
        Export CSV
      </button>
      <button onClick={() => exportToExcel(data, 'data.xlsx')}>
        Export Excel
      </button>
      <button onClick={() => exportToPDF(data, columns, 'data.pdf')}>
        Export PDF
      </button>
    </>
  );
}
```

## Column Configuration

```tsx
const column = {
  id: 'columnId',
  header: 'Column Header',
  accessor: 'dataKey', // or function: (row) => row.nested.value
  type: 'text', // text, number, date, boolean, select, tag, image, actions
  width: 150, // Fixed width
  minWidth: 100, // Minimum width
  maxWidth: 300, // Maximum width
  sortable: true,
  filterable: true,
  editable: true,
  resizable: true,
  frozen: true, // Sticky column
  hidden: false,
  align: 'left', // left, center, right
  cell: ({ value, row, column }) => <CustomCell />, // Custom cell renderer
  header: ({ column }) => <CustomHeader />, // Custom header renderer
  footer: ({ column, data }) => <CustomFooter />, // Custom footer
  filterFn: (row, columnId, filterValue) => { }, // Custom filter
  sortFn: (rowA, rowB, columnId) => { }, // Custom sort
  aggregateFn: 'sum', // sum, count, average, min, max, custom
};
```

## Hooks

- `useTable` - Table state management
- `useTableData` - Data manipulation
- `useTableSort` - Sorting logic
- `useTableFilter` - Filtering logic
- `useTablePagination` - Pagination state
- `useTableSelection` - Row selection
- `useTableExport` - Export functionality
- `useColumnResize` - Column resizing
- `useColumnReorder` - Column reordering

## TypeScript Support

Full type safety:

```tsx
import type { Column, TableData, TableProps } from '@elide/tables';

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: Column<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name' }
];

const data: TableData<User> = [
  { id: 1, name: 'John', email: 'john@example.com' }
];
```

## Performance

- Virtual scrolling for large datasets
- Memoized calculations
- Lazy loading
- Debounced filters
- Optimized re-renders

## License

MIT

## Contributing

Contributions welcome!
