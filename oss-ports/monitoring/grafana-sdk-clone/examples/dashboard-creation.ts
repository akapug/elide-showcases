/**
 * Dashboard Creation Example
 */

import {
  Dashboard,
  GraphPanel,
  StatPanel,
  TablePanel,
  QueryVariable,
  GrafanaClient,
  createPrometheusTarget,
} from '../src';

async function main() {
  // Create a dashboard
  const dashboard = new Dashboard({
    title: 'Application Monitoring',
    description: 'Production application metrics and performance',
    tags: ['application', 'production', 'monitoring'],
    timezone: 'browser',
    refresh: '30s',
    time: {
      from: 'now-6h',
      to: 'now',
    },
  });

  // Add template variables
  const instanceVar = new QueryVariable({
    name: 'instance',
    label: 'Instance',
    query: 'label_values(up, instance)',
    datasource: 'Prometheus',
    refresh: 'on_time_range_change',
    multi: true,
    includeAll: true,
    allValue: '.*',
  });
  dashboard.addVariable(instanceVar);

  // Create request rate graph
  const requestRatePanel = new GraphPanel({
    title: 'Request Rate',
    gridPos: { x: 0, y: 0, w: 12, h: 8 },
  });

  requestRatePanel.addTarget(
    createPrometheusTarget(
      'rate(http_requests_total{instance=~"$instance"}[5m])',
      {
        legendFormat: '{{method}} {{status}}',
        refId: 'A',
      }
    )
  );

  requestRatePanel.yaxes = [
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

  requestRatePanel.legend = {
    show: true,
    alignAsTable: true,
    avg: true,
    max: true,
    current: true,
    values: true,
  };

  dashboard.addPanel(requestRatePanel);

  // Create active users stat
  const activeUsersPanel = new StatPanel({
    title: 'Active Users',
    gridPos: { x: 12, y: 0, w: 6, h: 4 },
  });

  activeUsersPanel.addTarget(
    createPrometheusTarget('sum(active_users)', {
      refId: 'A',
    })
  );

  activeUsersPanel.fieldConfig = {
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
    overrides: [],
  };

  dashboard.addPanel(activeUsersPanel);

  // Create error rate stat
  const errorRatePanel = new StatPanel({
    title: 'Error Rate',
    gridPos: { x: 18, y: 0, w: 6, h: 4 },
  });

  errorRatePanel.addTarget(
    createPrometheusTarget(
      'rate(http_errors_total{instance=~"$instance"}[5m])',
      {
        refId: 'A',
      }
    )
  );

  errorRatePanel.fieldConfig = {
    defaults: {
      unit: 'reqps',
      decimals: 2,
      thresholds: {
        mode: 'absolute',
        steps: [
          { value: null, color: 'green' },
          { value: 1, color: 'yellow' },
          { value: 10, color: 'red' },
        ],
      },
    },
    overrides: [],
  };

  dashboard.addPanel(errorRatePanel);

  // Create service status table
  const serviceStatusPanel = new TablePanel({
    title: 'Service Status',
    gridPos: { x: 0, y: 8, w: 24, h: 8 },
  });

  serviceStatusPanel.addTarget(
    createPrometheusTarget('up{job="api"}', {
      format: 'table',
      instant: true,
      refId: 'A',
    })
  );

  serviceStatusPanel.options = {
    showHeader: true,
    sortBy: [
      {
        displayName: 'Status',
        desc: false,
      },
    ],
  };

  dashboard.addPanel(serviceStatusPanel);

  // Export to JSON
  console.log('Dashboard JSON:');
  console.log(JSON.stringify(dashboard.toJSON(), null, 2));

  // Upload to Grafana (if configured)
  const grafanaUrl = process.env.GRAFANA_URL;
  const grafanaKey = process.env.GRAFANA_API_KEY;

  if (grafanaUrl && grafanaKey) {
    const client = new GrafanaClient({
      url: grafanaUrl,
      apiKey: grafanaKey,
    });

    try {
      const result = await client.createDashboard(dashboard, {
        folder: 'General',
        overwrite: false,
        message: 'Created via SDK',
      });

      console.log('\nDashboard created successfully!');
      console.log('URL:', result.url);
      console.log('UID:', result.uid);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  } else {
    console.log('\nSet GRAFANA_URL and GRAFANA_API_KEY to upload dashboard');
  }
}

main().catch(console.error);
