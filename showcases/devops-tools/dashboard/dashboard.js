/**
 * DevOps Dashboard Client
 */

// ============================================================================
// State Management
// ============================================================================

const state = {
  currentTab: 'overview',
  data: {
    status: null,
    deployments: null,
    metrics: null,
    alerts: null,
    logs: null,
  },
  refreshInterval: 5000,
  timers: [],
};

// ============================================================================
// API Client
// ============================================================================

async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

// ============================================================================
// Tab Management
// ============================================================================

function initializeTabs() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  // Update state
  state.currentTab = tabName;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });

  // Load tab data
  loadTabData(tabName);
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadTabData(tabName) {
  switch (tabName) {
    case 'overview':
      await loadOverviewData();
      break;
    case 'deployments':
      await loadDeploymentsData();
      break;
    case 'monitoring':
      await loadMonitoringData();
      break;
    case 'alerts':
      await loadAlertsData();
      break;
    case 'logs':
      await loadLogsData();
      break;
  }
}

async function loadOverviewData() {
  // Load status
  const status = await fetchAPI('/status');
  if (status) {
    state.data.status = status;
    updateStatusIndicator(status.status === 'running');
  }

  // Load deployments
  const deployments = await fetchAPI('/deployments');
  if (deployments) {
    state.data.deployments = deployments;
    document.getElementById('active-deployments').textContent = deployments.active.length;
  }

  // Load alerts
  const alerts = await fetchAPI('/alerts');
  if (alerts) {
    state.data.alerts = alerts;
    document.getElementById('active-alerts').textContent = alerts.active.length;
  }

  // Load metrics
  const metrics = await fetchAPI('/metrics');
  if (metrics) {
    state.data.metrics = metrics;
    updateQuickStats(metrics);
  }

  // Update last updated time
  updateLastUpdated();
}

async function loadDeploymentsData() {
  const deployments = await fetchAPI('/deployments');
  if (!deployments) return;

  state.data.deployments = deployments;

  // Render active deployments
  renderActiveDeployments(deployments.active);

  // Render deployment history
  renderDeploymentHistory(deployments.history);
}

async function loadMonitoringData() {
  const metrics = await fetchAPI('/metrics');
  if (!metrics) return;

  state.data.metrics = metrics;

  // Update metric cards
  updateMetricCards(metrics.metrics);

  // Render metrics table
  renderMetricsTable(metrics.metrics);
}

async function loadAlertsData() {
  const alerts = await fetchAPI('/alerts');
  if (!alerts) return;

  state.data.alerts = alerts;

  // Update alert stats
  updateAlertStats(alerts.stats);

  // Render active alerts
  renderActiveAlerts(alerts.active);
}

async function loadLogsData() {
  const logs = await fetchAPI('/logs');
  if (!logs) return;

  state.data.logs = logs;

  // Render logs
  renderLogs(logs.logs);
}

// ============================================================================
// Rendering Functions
// ============================================================================

function updateStatusIndicator(online) {
  const indicator = document.getElementById('status-indicator');
  const text = document.getElementById('status-text');

  if (online) {
    indicator.classList.add('online');
    indicator.classList.remove('offline');
    text.textContent = 'All Systems Operational';
  } else {
    indicator.classList.add('offline');
    indicator.classList.remove('online');
    text.textContent = 'System Offline';
  }
}

function updateQuickStats(metrics) {
  if (!metrics.metrics) return;

  const cpuMetric = metrics.metrics.find(m => m.name === 'system.cpu.usage');
  const memoryMetric = metrics.metrics.find(m => m.name === 'system.memory.usage');
  const diskMetric = metrics.metrics.find(m => m.name === 'system.disk.usage');

  if (cpuMetric) {
    document.getElementById('cpu-usage').textContent =
      `${cpuMetric.latest.value.toFixed(1)}%`;
  }

  if (memoryMetric) {
    document.getElementById('memory-usage').textContent =
      `${memoryMetric.latest.value.toFixed(1)}%`;
  }

  if (diskMetric) {
    document.getElementById('disk-usage').textContent =
      `${diskMetric.latest.value.toFixed(1)}%`;
  }

  document.getElementById('network-io').textContent = 'Normal';

  // Calculate system health
  const avgUsage = (
    (cpuMetric?.latest.value || 0) +
    (memoryMetric?.latest.value || 0) +
    (diskMetric?.latest.value || 0)
  ) / 3;

  const health = Math.max(0, 100 - avgUsage);
  document.getElementById('system-health').textContent = `${health.toFixed(1)}%`;
}

function renderActiveDeployments(deployments) {
  const container = document.getElementById('active-deployments-list');

  if (deployments.length === 0) {
    container.innerHTML = '<p class="empty-state">No active deployments</p>';
    return;
  }

  container.innerHTML = deployments.map(d => `
    <div class="list-item">
      <div class="list-item-header">
        <span class="list-item-title">${d.name} v${d.version}</span>
        <span class="list-item-badge badge-info">${d.state}</span>
      </div>
      <div class="text-muted">
        Environment: ${d.environment} | Progress: ${d.progress.toFixed(1)}%
      </div>
      <div class="text-muted">Started: ${new Date(d.startTime).toLocaleString()}</div>
    </div>
  `).join('');
}

function renderDeploymentHistory(deployments) {
  const container = document.getElementById('deployment-history-list');

  if (deployments.length === 0) {
    container.innerHTML = '<p class="empty-state">No deployment history</p>';
    return;
  }

  container.innerHTML = deployments.map(d => {
    const badgeClass = d.state === 'completed' ? 'badge-success' :
                       d.state === 'failed' ? 'badge-danger' : 'badge-warning';

    return `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${d.name} v${d.version}</span>
          <span class="list-item-badge ${badgeClass}">${d.state}</span>
        </div>
        <div class="text-muted">
          Environment: ${d.environment}
        </div>
        <div class="text-muted">
          ${new Date(d.startTime).toLocaleString()}
          ${d.endTime ? ` - ${new Date(d.endTime).toLocaleString()}` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function updateMetricCards(metrics) {
  const cpuMetric = metrics.find(m => m.name === 'system.cpu.usage');
  const memoryMetric = metrics.find(m => m.name === 'system.memory.usage');
  const diskMetric = metrics.find(m => m.name === 'system.disk.usage');

  if (cpuMetric) {
    document.getElementById('mon-cpu').textContent =
      `${cpuMetric.latest.value.toFixed(1)}%`;
  }

  if (memoryMetric) {
    document.getElementById('mon-memory').textContent =
      `${memoryMetric.latest.value.toFixed(1)}%`;
  }

  if (diskMetric) {
    document.getElementById('mon-disk').textContent =
      `${diskMetric.latest.value.toFixed(1)}%`;
  }

  document.getElementById('mon-network').textContent = 'Normal';
}

function renderMetricsTable(metrics) {
  const container = document.getElementById('metrics-list');

  if (metrics.length === 0) {
    container.innerHTML = '<p class="empty-state">No metrics available</p>';
    return;
  }

  container.innerHTML = metrics.map(m => `
    <div class="metric-row">
      <div>
        <div class="metric-name">${m.name}</div>
        <div class="metric-type">${m.type}</div>
      </div>
      <div>${m.latest ? m.latest.value.toFixed(2) : '-'}</div>
      <div>${m.latest ? m.latest.unit : '-'}</div>
      <div class="text-muted">${m.count} values</div>
    </div>
  `).join('');
}

function updateAlertStats(stats) {
  document.getElementById('alert-total').textContent = stats.totalAlerts;
  document.getElementById('alert-critical').textContent = stats.bySeverity.critical || 0;
  document.getElementById('alert-warning').textContent = stats.bySeverity.warning || 0;
  document.getElementById('alert-acknowledged').textContent = stats.acknowledgedAlerts;
}

function renderActiveAlerts(alerts) {
  const container = document.getElementById('active-alerts-list');

  if (alerts.length === 0) {
    container.innerHTML = '<p class="empty-state">No active alerts</p>';
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-item ${a.severity}">
      <div class="alert-header">
        <div class="alert-title">${a.title}</div>
        <span class="alert-severity" style="background: ${getSeverityColor(a.severity)}; color: white;">
          ${a.severity}
        </span>
      </div>
      <div class="alert-message">${a.message}</div>
      <div class="alert-time">
        ${new Date(a.timestamp).toLocaleString()}
        ${a.acknowledged ? ' (Acknowledged)' : ''}
      </div>
    </div>
  `).join('');
}

function renderLogs(logs) {
  const container = document.getElementById('logs-list');

  if (logs.length === 0) {
    container.innerHTML = '<p class="empty-state">No logs available</p>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <div class="log-entry">
      <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
      <span class="log-level ${log.level}">[${log.level}]</span>
      <span class="log-source">${log.source}:</span>
      <span class="log-message">${log.message}</span>
    </div>
  `).join('');
}

// ============================================================================
// Utilities
// ============================================================================

function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return '#dc3545';
    case 'error':
      return '#dc3545';
    case 'warning':
      return '#ffc107';
    case 'info':
      return '#17a2b8';
    default:
      return '#6c757d';
  }
}

function updateLastUpdated() {
  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}

// ============================================================================
// Auto-refresh
// ============================================================================

function startAutoRefresh() {
  // Clear existing timers
  state.timers.forEach(timer => clearInterval(timer));
  state.timers = [];

  // Set up new refresh timer
  const timer = setInterval(() => {
    loadTabData(state.currentTab);
  }, state.refreshInterval);

  state.timers.push(timer);
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('DevOps Dashboard initialized');

  // Initialize tabs
  initializeTabs();

  // Load initial data
  loadOverviewData();

  // Start auto-refresh
  startAutoRefresh();

  // Add log filter handlers
  const logLevelFilter = document.getElementById('log-level-filter');
  const logSearch = document.getElementById('log-search');

  if (logLevelFilter) {
    logLevelFilter.addEventListener('change', () => {
      // Filter logic would go here
      console.log('Filter by level:', logLevelFilter.value);
    });
  }

  if (logSearch) {
    logSearch.addEventListener('input', (e) => {
      // Search logic would go here
      console.log('Search:', e.target.value);
    });
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  state.timers.forEach(timer => clearInterval(timer));
});
