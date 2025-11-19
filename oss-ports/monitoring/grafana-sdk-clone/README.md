# Grafana SDK Clone - Elide Implementation

A production-ready Grafana dashboard SDK ported to Elide, providing programmatic dashboard creation and management.

## Features

- **Dashboard Creation**: Programmatically create and manage Grafana dashboards
- **Panel Configuration**: Support for all panel types (Graph, Stat, Table, Heatmap, etc.)
- **Data Sources**: Configure and manage data sources (Prometheus, InfluxDB, etc.)
- **Alert Rules**: Define and manage alert rules and notifications
- **Templating**: Variable templating for dynamic dashboards
- **API Client**: Full Grafana HTTP API client
- **TypeScript Types**: Complete type definitions for all APIs
- **Import/Export**: Export dashboards as JSON for version control

## Installation

```bash
npm install @elide/grafana-sdk-clone
```

## Quick Start

```typescript
import {
  Dashboard,
  Panel,
  GraphPanel,
  StatPanel,
  Target,
  Template,
  GrafanaClient,
} from '@elide/grafana-sdk-clone';

// Create a dashboard
const dashboard = new Dashboard({
  title: 'Application Metrics',
  tags: ['application', 'production'],
  timezone: 'browser',
  refresh: '30s',
});

// Add a graph panel
const graphPanel = new GraphPanel({
  title: 'HTTP Requests',
  gridPos: { x: 0, y: 0, w: 12, h: 8 },
});

graphPanel.addTarget({
  expr: 'rate(http_requests_total[5m])',
  legendFormat: '{{method}} {{status}}',
  refId: 'A',
});

dashboard.addPanel(graphPanel);

// Add a stat panel
const statPanel = new StatPanel({
  title: 'Active Users',
  gridPos: { x: 12, y: 0, w: 6, h: 4 },
});

statPanel.addTarget({
  expr: 'active_users',
  refId: 'A',
});

dashboard.addPanel(statPanel);

// Export dashboard JSON
console.log(JSON.stringify(dashboard.toJSON(), null, 2));

// Upload to Grafana
const client = new GrafanaClient({
  url: 'http://localhost:3000',
  apiKey: 'your-api-key',
});

await client.createDashboard(dashboard);
```

## Dashboard Creation

### Basic Dashboard

```typescript
import { Dashboard } from '@elide/grafana-sdk-clone';

const dashboard = new Dashboard({
  title: 'My Dashboard',
  description: 'Application monitoring dashboard',
  tags: ['app', 'monitoring'],
  timezone: 'browser',
  refresh: '30s',
  time: {
    from: 'now-6h',
    to: 'now',
  },
});

// Set UID (optional, auto-generated if not provided)
dashboard.uid = 'my-dashboard-uid';

// Add metadata
dashboard.editable = true;
dashboard.graphTooltip = 'shared_crosshair';
dashboard.version = 1;
```

### Row Organization

```typescript
import { Row } from '@elide/grafana-sdk-clone';

// Add a row
const row = new Row({
  title: 'Application Metrics',
  collapsed: false,
});

dashboard.addRow(row);

// Add panels to row
row.addPanel(graphPanel);
row.addPanel(statPanel);
```

## Panel Types

### Graph Panel

```typescript
import { GraphPanel } from '@elide/grafana-sdk-clone';

const panel = new GraphPanel({
  title: 'Request Rate',
  description: '5-minute request rate',
  gridPos: { x: 0, y: 0, w: 12, h: 8 },
});

// Configure axes
panel.yaxes = [
  {
    format: 'reqps',
    label: 'Requests/sec',
    show: true,
  },
  {
    format: 'short',
    show: false,
  },
];

// Configure legend
panel.legend = {
  show: true,
  alignAsTable: true,
  avg: true,
  max: true,
  min: false,
  current: true,
  values: true,
};

// Add targets
panel.addTarget({
  expr: 'rate(http_requests_total[5m])',
  legendFormat: '{{method}}',
  refId: 'A',
});

panel.addTarget({
  expr: 'rate(http_errors_total[5m])',
  legendFormat: 'Errors',
  refId: 'B',
});
```

### Stat Panel

```typescript
import { StatPanel } from '@elide/grafana-sdk-clone';

const panel = new StatPanel({
  title: 'Total Users',
  gridPos: { x: 0, y: 0, w: 6, h: 4 },
});

panel.options = {
  orientation: 'horizontal',
  textMode: 'value_and_name',
  colorMode: 'value',
  graphMode: 'area',
  justifyMode: 'auto',
};

panel.fieldConfig = {
  defaults: {
    unit: 'short',
    decimals: 0,
    thresholds: {
      mode: 'absolute',
      steps: [
        { value: null, color: 'green' },
        { value: 1000, color: 'yellow' },
        { value: 5000, color: 'red' },
      ],
    },
  },
};

panel.addTarget({
  expr: 'sum(active_users)',
  refId: 'A',
});
```

### Table Panel

```typescript
import { TablePanel } from '@elide/grafana-sdk-clone';

const panel = new TablePanel({
  title: 'Service Status',
  gridPos: { x: 0, y: 0, w: 24, h: 8 },
});

panel.options = {
  showHeader: true,
  sortBy: [
    {
      displayName: 'Status',
      desc: false,
    },
  ],
};

panel.fieldConfig = {
  overrides: [
    {
      matcher: { id: 'byName', options: 'Status' },
      properties: [
        {
          id: 'custom.displayMode',
          value: 'color-background',
        },
        {
          id: 'mappings',
          value: [
            { value: 1, text: 'Up', color: 'green' },
            { value: 0, text: 'Down', color: 'red' },
          ],
        },
      ],
    },
  ],
};

panel.addTarget({
  expr: 'up{job="api"}',
  format: 'table',
  instant: true,
  refId: 'A',
});
```

### Heatmap Panel

```typescript
import { HeatmapPanel } from '@elide/grafana-sdk-clone';

const panel = new HeatmapPanel({
  title: 'Request Duration Distribution',
  gridPos: { x: 0, y: 0, w: 12, h: 8 },
});

panel.dataFormat = 'tsbuckets';
panel.yAxis = {
  format: 's',
  decimals: 2,
  logBase: 1,
};

panel.color = {
  mode: 'spectrum',
  cardColor: '#b4ff00',
  colorScale: 'sqrt',
  exponent: 0.5,
  colorScheme: 'interpolateSpectral',
};

panel.addTarget({
  expr: 'rate(http_request_duration_seconds_bucket[5m])',
  format: 'heatmap',
  legendFormat: '{{le}}',
  refId: 'A',
});
```

### Gauge Panel

```typescript
import { GaugePanel } from '@elide/grafana-sdk-clone';

const panel = new GaugePanel({
  title: 'CPU Usage',
  gridPos: { x: 0, y: 0, w: 6, h: 6 },
});

panel.options = {
  orientation: 'auto',
  showThresholdLabels: true,
  showThresholdMarkers: true,
};

panel.fieldConfig = {
  defaults: {
    min: 0,
    max: 100,
    unit: 'percent',
    thresholds: {
      mode: 'absolute',
      steps: [
        { value: null, color: 'green' },
        { value: 60, color: 'yellow' },
        { value: 80, color: 'red' },
      ],
    },
  },
};

panel.addTarget({
  expr: 'avg(cpu_usage_percent)',
  refId: 'A',
});
```

### Bar Gauge Panel

```typescript
import { BarGaugePanel } from '@elide/grafana-sdk-clone';

const panel = new BarGaugePanel({
  title: 'Service Health',
  gridPos: { x: 0, y: 0, w: 6, h: 8 },
});

panel.options = {
  orientation: 'horizontal',
  displayMode: 'gradient',
  showUnfilled: true,
};

panel.fieldConfig = {
  defaults: {
    min: 0,
    max: 100,
    unit: 'percent',
  },
};

panel.addTarget({
  expr: 'service_health{job="api"}',
  legendFormat: '{{service}}',
  refId: 'A',
});
```

## Data Sources

### Prometheus Data Source

```typescript
import { PrometheusTarget } from '@elide/grafana-sdk-clone';

const target: PrometheusTarget = {
  expr: 'rate(http_requests_total[5m])',
  legendFormat: '{{method}} {{status}}',
  interval: '',
  format: 'time_series',
  refId: 'A',
  instant: false,
};

panel.addTarget(target);
```

### InfluxDB Data Source

```typescript
import { InfluxDBTarget } from '@elide/grafana-sdk-clone';

const target: InfluxDBTarget = {
  measurement: 'cpu',
  policy: 'default',
  tags: [
    { key: 'host', value: 'server1', operator: '=' },
  ],
  groupBy: [
    { type: 'time', params: ['$__interval'] },
    { type: 'tag', params: ['host'] },
  ],
  select: [
    [
      { type: 'field', params: ['usage_idle'] },
      { type: 'mean', params: [] },
    ],
  ],
  refId: 'A',
};

panel.addTarget(target);
```

### Elasticsearch Data Source

```typescript
import { ElasticsearchTarget } from '@elide/grafana-sdk-clone';

const target: ElasticsearchTarget = {
  query: 'status:200',
  metrics: [
    {
      type: 'count',
      id: '1',
    },
  ],
  bucketAggs: [
    {
      type: 'date_histogram',
      field: '@timestamp',
      id: '2',
      settings: {
        interval: 'auto',
      },
    },
  ],
  refId: 'A',
};

panel.addTarget(target);
```

## Templating

### Query Variables

```typescript
import { QueryVariable } from '@elide/grafana-sdk-clone';

const variable = new QueryVariable({
  name: 'instance',
  label: 'Instance',
  query: 'label_values(up, instance)',
  datasource: 'Prometheus',
  refresh: 'on_time_range_change',
  multi: true,
  includeAll: true,
  allValue: '.*',
});

dashboard.addVariable(variable);

// Use in panel targets
panel.addTarget({
  expr: 'up{instance=~"$instance"}',
  refId: 'A',
});
```

### Custom Variables

```typescript
import { CustomVariable } from '@elide/grafana-sdk-clone';

const variable = new CustomVariable({
  name: 'environment',
  label: 'Environment',
  query: 'production,staging,development',
  multi: false,
  includeAll: false,
});

dashboard.addVariable(variable);
```

### Interval Variables

```typescript
import { IntervalVariable } from '@elide/grafana-sdk-clone';

const variable = new IntervalVariable({
  name: 'interval',
  label: 'Interval',
  values: ['1m', '5m', '10m', '30m', '1h'],
  auto: true,
  autoCount: 30,
  autoMin: '10s',
});

dashboard.addVariable(variable);

// Use in queries
panel.addTarget({
  expr: 'rate(http_requests_total[$interval])',
  refId: 'A',
});
```

### Datasource Variables

```typescript
import { DatasourceVariable } from '@elide/grafana-sdk-clone';

const variable = new DatasourceVariable({
  name: 'datasource',
  label: 'Data Source',
  type: 'prometheus',
  regex: '/prod.*/',
});

dashboard.addVariable(variable);
```

## Alert Rules

### Threshold Alert

```typescript
import { Alert } from '@elide/grafana-sdk-clone';

const alert = new Alert({
  name: 'High Error Rate',
  conditions: [
    {
      evaluator: {
        type: 'gt',
        params: [100],
      },
      operator: {
        type: 'and',
      },
      query: {
        params: ['A', '5m', 'now'],
      },
      reducer: {
        type: 'avg',
      },
      type: 'query',
    },
  ],
  executionErrorState: 'alerting',
  frequency: '60s',
  handler: 1,
  message: 'Error rate is above 100/s',
  name: 'High Error Rate',
  noDataState: 'no_data',
  notifications: [],
});

panel.alert = alert;
```

### Alert Notifications

```typescript
import { AlertNotification } from '@elide/grafana-sdk-clone';

const notification = new AlertNotification({
  type: 'email',
  uid: 'team-email',
  settings: {
    addresses: 'team@example.com',
  },
});

alert.addNotification(notification);

// Slack notification
const slackNotification = new AlertNotification({
  type: 'slack',
  uid: 'slack-channel',
  settings: {
    url: 'https://hooks.slack.com/services/...',
    channel: '#alerts',
    username: 'Grafana',
  },
});

alert.addNotification(slackNotification);
```

## Grafana API Client

### Authentication

```typescript
import { GrafanaClient } from '@elide/grafana-sdk-clone';

// API Key authentication
const client = new GrafanaClient({
  url: 'http://localhost:3000',
  apiKey: 'your-api-key',
});

// Basic authentication
const client2 = new GrafanaClient({
  url: 'http://localhost:3000',
  auth: {
    username: 'admin',
    password: 'admin',
  },
});

// Bearer token authentication
const client3 = new GrafanaClient({
  url: 'http://localhost:3000',
  token: 'your-bearer-token',
});
```

### Dashboard Operations

```typescript
// Create dashboard
const result = await client.createDashboard(dashboard, {
  folder: 'General',
  overwrite: false,
  message: 'Initial creation',
});

console.log('Dashboard URL:', result.url);
console.log('Dashboard UID:', result.uid);

// Get dashboard
const existingDashboard = await client.getDashboard('my-dashboard-uid');

// Update dashboard
existingDashboard.title = 'Updated Title';
await client.updateDashboard(existingDashboard, {
  overwrite: true,
  message: 'Updated title',
});

// Delete dashboard
await client.deleteDashboard('my-dashboard-uid');

// Search dashboards
const dashboards = await client.searchDashboards({
  query: 'application',
  tags: ['production'],
  starred: true,
});

// Get dashboard by ID
const dashboard = await client.getDashboardById(123);
```

### Folder Operations

```typescript
// Create folder
const folder = await client.createFolder({
  title: 'Production Dashboards',
  uid: 'production',
});

// Get folders
const folders = await client.getFolders();

// Update folder
await client.updateFolder('production', {
  title: 'Production Dashboards (Updated)',
});

// Delete folder
await client.deleteFolder('production');
```

### Data Source Operations

```typescript
// Create data source
const datasource = await client.createDatasource({
  name: 'Prometheus Production',
  type: 'prometheus',
  url: 'http://prometheus:9090',
  access: 'proxy',
  isDefault: false,
});

// Get data sources
const datasources = await client.getDatasources();

// Get data source by ID
const ds = await client.getDatasource(1);

// Update data source
await client.updateDatasource(1, {
  name: 'Prometheus Production (Updated)',
  url: 'http://new-prometheus:9090',
});

// Delete data source
await client.deleteDatasource(1);

// Test data source
const result = await client.testDatasource(datasource);
```

### User and Organization

```typescript
// Get current user
const user = await client.getCurrentUser();

// Get organizations
const orgs = await client.getOrganizations();

// Switch organization
await client.switchOrganization(2);

// Get users
const users = await client.getUsers();
```

### Snapshot Operations

```typescript
// Create snapshot
const snapshot = await client.createSnapshot(dashboard, {
  name: 'Production Snapshot',
  expires: 3600, // 1 hour
  external: false,
});

console.log('Snapshot URL:', snapshot.url);

// Delete snapshot
await client.deleteSnapshot(snapshot.key);
```

## Advanced Features

### Dashboard Links

```typescript
import { DashboardLink } from '@elide/grafana-sdk-clone';

// Dashboard link
const link = new DashboardLink({
  title: 'Related Dashboard',
  type: 'dashboards',
  tags: ['related'],
  asDropdown: false,
  includeVars: true,
  keepTime: true,
});

dashboard.addLink(link);

// External link
const externalLink = new DashboardLink({
  title: 'Documentation',
  type: 'link',
  url: 'https://docs.example.com',
  targetBlank: true,
});

dashboard.addLink(externalLink);
```

### Annotations

```typescript
import { Annotation } from '@elide/grafana-sdk-clone';

const annotation = new Annotation({
  name: 'Deployments',
  datasource: 'Prometheus',
  enable: true,
  expr: 'deployment_event',
  tagKeys: 'service,version',
  textFormat: 'Deployment: {{version}}',
  iconColor: 'rgba(0, 211, 255, 1)',
});

dashboard.addAnnotation(annotation);
```

### Time Picker Configuration

```typescript
dashboard.timepicker = {
  refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'],
  time_options: ['5m', '15m', '1h', '6h', '12h', '24h', '2d', '7d', '30d'],
  hidden: false,
  collapse: false,
};
```

### Dashboard Permissions

```typescript
// Set dashboard permissions
await client.setDashboardPermissions('my-dashboard-uid', [
  {
    role: 'Viewer',
    permission: 1, // View
  },
  {
    role: 'Editor',
    permission: 2, // Edit
  },
  {
    teamId: 1,
    permission: 4, // Admin
  },
  {
    userId: 5,
    permission: 2, // Edit
  },
]);

// Get dashboard permissions
const permissions = await client.getDashboardPermissions('my-dashboard-uid');
```

## Import/Export

### Export Dashboard

```typescript
// Export as JSON
const json = dashboard.toJSON();
await fs.writeFile('dashboard.json', JSON.stringify(json, null, 2));

// Export as YAML
const yaml = dashboard.toYAML();
await fs.writeFile('dashboard.yaml', yaml);
```

### Import Dashboard

```typescript
import { Dashboard } from '@elide/grafana-sdk-clone';

// Import from JSON
const json = await fs.readFile('dashboard.json', 'utf-8');
const dashboard = Dashboard.fromJSON(JSON.parse(json));

// Import from YAML
const yaml = await fs.readFile('dashboard.yaml', 'utf-8');
const dashboard2 = Dashboard.fromYAML(yaml);

// Upload to Grafana
await client.createDashboard(dashboard);
```

## Testing

```typescript
import { Dashboard, GraphPanel } from '@elide/grafana-sdk-clone';

describe('Dashboard', () => {
  it('should create dashboard', () => {
    const dashboard = new Dashboard({
      title: 'Test Dashboard',
    });

    expect(dashboard.title).toBe('Test Dashboard');
    expect(dashboard.uid).toBeDefined();
  });

  it('should add panels', () => {
    const dashboard = new Dashboard({ title: 'Test' });
    const panel = new GraphPanel({ title: 'Panel 1' });

    dashboard.addPanel(panel);

    expect(dashboard.panels).toHaveLength(1);
    expect(dashboard.panels[0].title).toBe('Panel 1');
  });

  it('should export to JSON', () => {
    const dashboard = new Dashboard({ title: 'Test' });
    const json = dashboard.toJSON();

    expect(json.title).toBe('Test');
    expect(json.panels).toBeDefined();
  });
});
```

## TypeScript Support

Full TypeScript support with strict types:

```typescript
import {
  Dashboard,
  DashboardOptions,
  Panel,
  GraphPanel,
  Target,
} from '@elide/grafana-sdk-clone';

const options: DashboardOptions = {
  title: 'My Dashboard',
  tags: ['app'],
  timezone: 'browser',
};

const dashboard: Dashboard = new Dashboard(options);

const target: Target = {
  expr: 'up',
  refId: 'A',
};

const panel: GraphPanel = new GraphPanel({ title: 'Test' });
panel.addTarget(target);
```

## License

MIT License - See LICENSE file for details

## Credits

Ported to Elide from the original Grafana SDK libraries. Original implementations by Grafana Labs.

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.
