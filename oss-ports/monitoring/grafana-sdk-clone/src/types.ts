/**
 * Core types and interfaces for Grafana SDK
 */

export interface DashboardOptions {
  title: string;
  description?: string;
  tags?: string[];
  timezone?: string;
  refresh?: string;
  time?: TimeRange;
  uid?: string;
  version?: number;
  editable?: boolean;
  graphTooltip?: number | string;
  style?: string;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface GridPos {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelOptions {
  id?: number;
  title: string;
  description?: string;
  gridPos?: GridPos;
  transparent?: boolean;
  datasource?: string | null;
  interval?: string;
  links?: PanelLink[];
  repeat?: string;
  repeatDirection?: 'h' | 'v';
  maxPerRow?: number;
}

export interface PanelLink {
  title: string;
  url: string;
  targetBlank?: boolean;
}

export interface Target {
  refId: string;
  hide?: boolean;
  datasource?: string | null;
  [key: string]: any;
}

export interface PrometheusTarget extends Target {
  expr: string;
  legendFormat?: string;
  interval?: string;
  format?: string;
  instant?: boolean;
  exemplar?: boolean;
}

export interface InfluxDBTarget extends Target {
  measurement?: string;
  policy?: string;
  tags?: Array<{ key: string; value: string; operator?: string }>;
  groupBy?: Array<{ type: string; params: string[] }>;
  select?: Array<Array<{ type: string; params: any[] }>>;
  rawQuery?: boolean;
  query?: string;
}

export interface ElasticsearchTarget extends Target {
  query?: string;
  alias?: string;
  metrics?: Array<{ type: string; id: string; field?: string; settings?: any }>;
  bucketAggs?: Array<{ type: string; id: string; field?: string; settings?: any }>;
  timeField?: string;
}

export interface FieldConfig {
  defaults?: FieldConfigDefaults;
  overrides?: FieldConfigOverride[];
}

export interface FieldConfigDefaults {
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  displayName?: string;
  color?: ColorConfig;
  thresholds?: ThresholdsConfig;
  mappings?: ValueMapping[];
  links?: DataLink[];
  custom?: Record<string, any>;
}

export interface FieldConfigOverride {
  matcher: FieldMatcher;
  properties: Array<{ id: string; value: any }>;
}

export interface FieldMatcher {
  id: string;
  options?: any;
}

export interface ColorConfig {
  mode?: string;
  fixedColor?: string;
  seriesBy?: string;
}

export interface ThresholdsConfig {
  mode: 'absolute' | 'percentage';
  steps: ThresholdStep[];
}

export interface ThresholdStep {
  value: number | null;
  color: string;
}

export interface ValueMapping {
  type?: string;
  value?: any;
  text?: string;
  color?: string;
  [key: string]: any;
}

export interface DataLink {
  title: string;
  url: string;
  targetBlank?: boolean;
}

export interface Variable {
  name: string;
  type: string;
  label?: string;
  hide?: number;
  skipUrlSync?: boolean;
  toJSON(): any;
}

export interface QueryVariableOptions {
  name: string;
  label?: string;
  query: string;
  datasource: string | null;
  refresh?: number | string;
  regex?: string;
  sort?: number;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string;
  current?: VariableValue;
  options?: VariableOption[];
}

export interface CustomVariableOptions {
  name: string;
  label?: string;
  query: string;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string;
  current?: VariableValue;
  options?: VariableOption[];
}

export interface IntervalVariableOptions {
  name: string;
  label?: string;
  values: string[];
  auto?: boolean;
  autoCount?: number;
  autoMin?: string;
  current?: VariableValue;
}

export interface DatasourceVariableOptions {
  name: string;
  label?: string;
  type: string;
  regex?: string;
  current?: VariableValue;
}

export interface VariableValue {
  text: string | string[];
  value: string | string[];
}

export interface VariableOption {
  text: string;
  value: string;
  selected?: boolean;
}

export interface AlertOptions {
  name: string;
  message?: string;
  conditions: AlertCondition[];
  executionErrorState?: string;
  frequency?: string;
  handler?: number;
  noDataState?: string;
  notifications?: AlertNotificationRef[];
  for?: string;
}

export interface AlertCondition {
  evaluator: AlertEvaluator;
  operator: AlertOperator;
  query: AlertQuery;
  reducer: AlertReducer;
  type: string;
}

export interface AlertEvaluator {
  type: string;
  params: any[];
}

export interface AlertOperator {
  type: string;
}

export interface AlertQuery {
  params: string[];
}

export interface AlertReducer {
  type: string;
  params?: any[];
}

export interface AlertNotificationRef {
  uid: string;
}

export interface AlertNotificationOptions {
  type: string;
  uid: string;
  name?: string;
  isDefault?: boolean;
  sendReminder?: boolean;
  frequency?: string;
  settings?: Record<string, any>;
}

export interface AnnotationOptions {
  name: string;
  datasource: string | null;
  enable?: boolean;
  iconColor?: string;
  [key: string]: any;
}

export interface DashboardLinkOptions {
  title: string;
  type: 'link' | 'dashboards';
  icon?: string;
  tooltip?: string;
  url?: string;
  tags?: string[];
  asDropdown?: boolean;
  targetBlank?: boolean;
  includeVars?: boolean;
  keepTime?: boolean;
}

export interface RowOptions {
  title?: string;
  collapsed?: boolean;
  showTitle?: boolean;
  gridPos?: GridPos;
}

export interface DatasourceConfig {
  name: string;
  type: string;
  url?: string;
  access?: 'proxy' | 'direct';
  isDefault?: boolean;
  basicAuth?: boolean;
  basicAuthUser?: string;
  basicAuthPassword?: string;
  withCredentials?: boolean;
  jsonData?: Record<string, any>;
  secureJsonData?: Record<string, any>;
}

export interface GrafanaClientOptions {
  url: string;
  apiKey?: string;
  auth?: {
    username: string;
    password: string;
  };
  token?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface DashboardCreateOptions {
  folder?: string;
  folderId?: number;
  overwrite?: boolean;
  message?: string;
}

export interface DashboardCreateResult {
  id: number;
  uid: string;
  url: string;
  status: string;
  version: number;
  slug: string;
}

export interface DashboardSearchOptions {
  query?: string;
  tags?: string[];
  type?: 'dash-db' | 'dash-folder';
  dashboardIds?: number[];
  folderIds?: number[];
  starred?: boolean;
  limit?: number;
  page?: number;
}

export interface FolderOptions {
  title: string;
  uid?: string;
}

export interface DashboardPermission {
  id?: number;
  dashboardId?: number;
  role?: string;
  userId?: number;
  teamId?: number;
  permission: number;
  created?: string;
  updated?: string;
}

export type PanelType =
  | 'graph'
  | 'stat'
  | 'gauge'
  | 'bargauge'
  | 'table'
  | 'heatmap'
  | 'timeseries'
  | 'barchart'
  | 'piechart'
  | 'text'
  | 'logs'
  | 'nodeGraph'
  | 'alertlist';
