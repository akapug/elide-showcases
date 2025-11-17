/**
 * OpenTelemetry Semantic Conventions
 */

export const SemanticAttributes = {
  // HTTP
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_TARGET: 'http.target',
  HTTP_HOST: 'http.host',
  HTTP_SCHEME: 'http.scheme',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_USER_AGENT: 'http.user_agent',
  HTTP_REQUEST_CONTENT_LENGTH: 'http.request_content_length',
  HTTP_RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
  HTTP_ROUTE: 'http.route',
  HTTP_FLAVOR: 'http.flavor',
  HTTP_SERVER_NAME: 'http.server_name',
  HTTP_CLIENT_IP: 'http.client_ip',

  // Database
  DB_SYSTEM: 'db.system',
  DB_CONNECTION_STRING: 'db.connection_string',
  DB_USER: 'db.user',
  DB_NAME: 'db.name',
  DB_STATEMENT: 'db.statement',
  DB_OPERATION: 'db.operation',
  DB_SQL_TABLE: 'db.sql.table',

  // Network
  NET_PEER_IP: 'net.peer.ip',
  NET_PEER_PORT: 'net.peer.port',
  NET_PEER_NAME: 'net.peer.name',
  NET_HOST_IP: 'net.host.ip',
  NET_HOST_PORT: 'net.host.port',
  NET_HOST_NAME: 'net.host.name',
  NET_TRANSPORT: 'net.transport',

  // RPC
  RPC_SYSTEM: 'rpc.system',
  RPC_SERVICE: 'rpc.service',
  RPC_METHOD: 'rpc.method',
  RPC_GRPC_STATUS_CODE: 'rpc.grpc.status_code',

  // Messaging
  MESSAGING_SYSTEM: 'messaging.system',
  MESSAGING_DESTINATION: 'messaging.destination',
  MESSAGING_DESTINATION_KIND: 'messaging.destination_kind',
  MESSAGING_TEMP_DESTINATION: 'messaging.temp_destination',
  MESSAGING_PROTOCOL: 'messaging.protocol',
  MESSAGING_PROTOCOL_VERSION: 'messaging.protocol_version',
  MESSAGING_URL: 'messaging.url',
  MESSAGING_MESSAGE_ID: 'messaging.message_id',
  MESSAGING_CONVERSATION_ID: 'messaging.conversation_id',
  MESSAGING_OPERATION: 'messaging.operation',
  MESSAGING_CONSUMER_ID: 'messaging.consumer_id',

  // Exception
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_STACKTRACE: 'exception.stacktrace',
  EXCEPTION_ESCAPED: 'exception.escaped',

  // Service
  SERVICE_NAME: 'service.name',
  SERVICE_NAMESPACE: 'service.namespace',
  SERVICE_INSTANCE_ID: 'service.instance.id',
  SERVICE_VERSION: 'service.version',

  // Deployment
  DEPLOYMENT_ENVIRONMENT: 'deployment.environment',

  // Cloud
  CLOUD_PROVIDER: 'cloud.provider',
  CLOUD_ACCOUNT_ID: 'cloud.account.id',
  CLOUD_REGION: 'cloud.region',
  CLOUD_AVAILABILITY_ZONE: 'cloud.availability_zone',
  CLOUD_PLATFORM: 'cloud.platform',

  // Container
  CONTAINER_NAME: 'container.name',
  CONTAINER_ID: 'container.id',
  CONTAINER_IMAGE_NAME: 'container.image.name',
  CONTAINER_IMAGE_TAG: 'container.image.tag',

  // Kubernetes
  K8S_CLUSTER_NAME: 'k8s.cluster.name',
  K8S_NAMESPACE_NAME: 'k8s.namespace.name',
  K8S_POD_NAME: 'k8s.pod.name',
  K8S_POD_UID: 'k8s.pod.uid',
  K8S_CONTAINER_NAME: 'k8s.container.name',
  K8S_DEPLOYMENT_NAME: 'k8s.deployment.name',
  K8S_REPLICASET_NAME: 'k8s.replicaset.name',
  K8S_STATEFULSET_NAME: 'k8s.statefulset.name',
  K8S_DAEMONSET_NAME: 'k8s.daemonset.name',
  K8S_JOB_NAME: 'k8s.job.name',
  K8S_CRONJOB_NAME: 'k8s.cronjob.name',

  // Process
  PROCESS_PID: 'process.pid',
  PROCESS_EXECUTABLE_NAME: 'process.executable.name',
  PROCESS_EXECUTABLE_PATH: 'process.executable.path',
  PROCESS_COMMAND: 'process.command',
  PROCESS_COMMAND_LINE: 'process.command_line',
  PROCESS_COMMAND_ARGS: 'process.command_args',
  PROCESS_OWNER: 'process.owner',
  PROCESS_RUNTIME_NAME: 'process.runtime.name',
  PROCESS_RUNTIME_VERSION: 'process.runtime.version',
  PROCESS_RUNTIME_DESCRIPTION: 'process.runtime.description',

  // FaaS
  FAAS_TRIGGER: 'faas.trigger',
  FAAS_EXECUTION: 'faas.execution',
  FAAS_DOCUMENT_COLLECTION: 'faas.document.collection',
  FAAS_DOCUMENT_OPERATION: 'faas.document.operation',
  FAAS_DOCUMENT_TIME: 'faas.document.time',
  FAAS_DOCUMENT_NAME: 'faas.document.name',
  FAAS_TIME: 'faas.time',
  FAAS_CRON: 'faas.cron',
  FAAS_COLDSTART: 'faas.coldstart',
  FAAS_INVOKED_NAME: 'faas.invoked_name',
  FAAS_INVOKED_PROVIDER: 'faas.invoked_provider',
  FAAS_INVOKED_REGION: 'faas.invoked_region',
};

export const SemanticResourceAttributes = {
  SERVICE_NAME: 'service.name',
  SERVICE_NAMESPACE: 'service.namespace',
  SERVICE_INSTANCE_ID: 'service.instance.id',
  SERVICE_VERSION: 'service.version',
  TELEMETRY_SDK_NAME: 'telemetry.sdk.name',
  TELEMETRY_SDK_LANGUAGE: 'telemetry.sdk.language',
  TELEMETRY_SDK_VERSION: 'telemetry.sdk.version',
};
