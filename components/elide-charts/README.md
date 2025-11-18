# @elide/charts

Comprehensive data visualization library for Elide - Create beautiful, interactive charts and graphs with React.

## Features

- 📊 **20+ Chart Types** - Line, Bar, Pie, Area, Scatter, and more
- ⚡ **Real-time Updates** - Live data streaming support
- 🎨 **Customizable** - Full theming and styling control
- 📱 **Responsive** - Adapts to any screen size
- 🎯 **Interactive** - Tooltips, legends, zoom, pan
- 📈 **Advanced** - Combo charts, dual axes, stacked series
- 🔥 **TypeScript** - Full type definitions
- 🚀 **Performance** - Canvas and SVG rendering options

## Installation

```bash
npm install @elide/charts
# or
yarn add @elide/charts
# or
pnpm add @elide/charts
```

## Chart Components (25+ components)

### Basic Charts (8)
- LineChart - Line and area line charts
- BarChart - Vertical and horizontal bar charts
- PieChart - Pie and donut charts
- AreaChart - Filled area charts
- ScatterChart - Scatter and bubble charts
- RadarChart - Radar/spider charts
- PolarChart - Polar area charts
- FunnelChart - Funnel and pyramid charts

### Advanced Charts (8)
- ComboChart - Combined chart types
- CandlestickChart - Financial candlestick charts
- BoxPlotChart - Statistical box plots
- HeatmapChart - Heat map visualizations
- TreemapChart - Hierarchical treemap
- SankeyChart - Flow diagrams
- GaugeChart - Gauge and meter charts
- WaterfallChart - Waterfall charts

### Time Series (3)
- TimeSeriesChart - Time-based data
- StreamChart - Streaming real-time data
- SparklineChart - Compact inline charts

### Special Purpose (6)
- ProgressChart - Progress visualization
- ComparisonChart - Side-by-side comparisons
- DistributionChart - Data distribution
- NetworkChart - Node relationship graphs
- GeoChart - Geographic/map charts
- CustomChart - Build your own

## Quick Start

### Line Chart

```tsx
import { LineChart } from '@elide/charts';

const data = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 3000, expenses: 1398 },
  { month: 'Mar', revenue: 2000, expenses: 9800 },
  { month: 'Apr', revenue: 2780, expenses: 3908 },
  { month: 'May', revenue: 1890, expenses: 4800 },
  { month: 'Jun', revenue: 2390, expenses: 3800 }
];

function App() {
  return (
    <LineChart
      data={data}
      xKey="month"
      lines={[
        { dataKey: 'revenue', stroke: '#8884d8', name: 'Revenue' },
        { dataKey: 'expenses', stroke: '#82ca9d', name: 'Expenses' }
      ]}
      height={400}
      showGrid
      showLegend
      showTooltip
    />
  );
}
```

### Bar Chart

```tsx
import { BarChart } from '@elide/charts';

const data = [
  { category: 'A', value: 400 },
  { category: 'B', value: 300 },
  { category: 'C', value: 200 },
  { category: 'D', value: 278 },
  { category: 'E', value: 189 }
];

<BarChart
  data={data}
  xKey="category"
  bars={[
    { dataKey: 'value', fill: '#8884d8' }
  ]}
  orientation="vertical"
  height={300}
/>
```

### Pie Chart

```tsx
import { PieChart } from '@elide/charts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 }
];

<PieChart
  data={data}
  nameKey="name"
  valueKey="value"
  variant="donut"
  showLabels
  showPercentage
  height={400}
/>
```

### Real-time Streaming Chart

```tsx
import { StreamChart } from '@elide/charts';
import { useState, useEffect } from 'react';

function RealTimeChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [
        ...prev,
        {
          timestamp: Date.now(),
          value: Math.random() * 100
        }
      ].slice(-50)); // Keep last 50 points
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <StreamChart
      data={data}
      xKey="timestamp"
      yKey="value"
      maxDataPoints={50}
      animate
      height={300}
    />
  );
}
```

### Combo Chart

```tsx
import { ComboChart } from '@elide/charts';

<ComboChart
  data={data}
  xKey="month"
  charts={[
    { type: 'bar', dataKey: 'revenue', fill: '#8884d8' },
    { type: 'line', dataKey: 'profit', stroke: '#82ca9d' },
    { type: 'area', dataKey: 'expenses', fill: '#ffc658' }
  ]}
  height={400}
/>
```

### Interactive Features

```tsx
import { LineChart } from '@elide/charts';

<LineChart
  data={data}
  // Zoom and pan
  enableZoom
  enablePan
  // Interactive tooltip
  tooltipConfig={{
    trigger: 'axis',
    formatter: (data) => `Value: ${data.value}`
  }}
  // Legend interaction
  legendConfig={{
    onClick: (item) => console.log('Legend clicked:', item),
    align: 'right'
  }}
  // Axis configuration
  xAxis={{
    label: 'Time',
    tickFormat: (value) => new Date(value).toLocaleDateString()
  }}
  yAxis={{
    label: 'Value',
    min: 0,
    max: 100
  }}
/>
```

### Theming

```tsx
import { ChartThemeProvider } from '@elide/charts';

const customTheme = {
  colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'],
  grid: {
    stroke: '#e0e0e0',
    strokeDasharray: '5 5'
  },
  axis: {
    stroke: '#666',
    fontSize: 12
  },
  tooltip: {
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4
  }
};

<ChartThemeProvider theme={customTheme}>
  <LineChart data={data} />
</ChartThemeProvider>
```

## Advanced Features

### Dual Y-Axis

```tsx
<LineChart
  data={data}
  xKey="date"
  yAxes={[
    {
      id: 'left',
      position: 'left',
      dataKeys: ['temperature']
    },
    {
      id: 'right',
      position: 'right',
      dataKeys: ['humidity']
    }
  ]}
/>
```

### Custom Annotations

```tsx
<LineChart
  data={data}
  annotations={[
    {
      type: 'line',
      x: '2024-01-15',
      label: 'Product Launch',
      color: '#ff0000'
    },
    {
      type: 'area',
      xStart: '2024-02-01',
      xEnd: '2024-02-15',
      label: 'Promotion Period',
      color: 'rgba(0, 255, 0, 0.1)'
    }
  ]}
/>
```

### Export Charts

```tsx
import { useChartExport } from '@elide/charts';

function MyChart() {
  const { exportToPNG, exportToSVG, exportToCSV } = useChartExport();

  return (
    <>
      <LineChart ref={chartRef} data={data} />
      <button onClick={() => exportToPNG(chartRef)}>Export PNG</button>
      <button onClick={() => exportToSVG(chartRef)}>Export SVG</button>
      <button onClick={() => exportToCSV(data)}>Export CSV</button>
    </>
  );
}
```

## Hooks

- `useChart` - Chart state management
- `useChartData` - Data manipulation and formatting
- `useChartExport` - Export functionality
- `useChartAnimation` - Animation controls
- `useChartInteraction` - Interaction handling
- `useChartResize` - Responsive sizing

## TypeScript Support

Full TypeScript definitions included:

```tsx
import type { LineChartProps, ChartData, ChartTheme } from '@elide/charts';

const chartData: ChartData[] = [
  { x: 1, y: 100 }
];

const props: LineChartProps = {
  data: chartData,
  height: 400
};
```

## Performance

- Canvas rendering for large datasets (>1000 points)
- SVG rendering for smaller datasets with interactivity
- Virtual scrolling for time series
- Data decimation for performance
- WebGL support for extreme performance

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines.
