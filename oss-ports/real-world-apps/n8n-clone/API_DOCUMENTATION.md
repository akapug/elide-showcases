# Elide Workflow - API Documentation

Complete REST API documentation for the Elide Workflow automation platform.

## Base URL

```
http://localhost:5678/api
```

## Authentication

Currently, the API is open. In production, implement JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

## Workflows API

### List All Workflows

Get a list of all workflows.

**Endpoint:** `GET /api/workflows`

**Query Parameters:**
- `active` (boolean, optional): Filter by active status
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/workflows?active=true"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123",
      "name": "My Workflow",
      "description": "Example workflow",
      "active": true,
      "nodes": [...],
      "connections": {...},
      "settings": {...},
      "tags": ["automation", "production"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "createdBy": null
    }
  ],
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Get Workflow by ID

Get a specific workflow by its ID.

**Endpoint:** `GET /api/workflows/:id`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/workflows/abc-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123",
    "name": "My Workflow",
    "description": "Example workflow",
    "active": true,
    "nodes": [
      {
        "id": "node-1",
        "name": "Trigger",
        "type": "manual",
        "typeVersion": 1,
        "position": {"x": 250, "y": 300},
        "parameters": {}
      }
    ],
    "connections": {},
    "settings": {
      "executionOrder": "V1",
      "saveManualExecutions": true,
      "executionTimeout": 300,
      "timezone": "UTC"
    }
  }
}
```

### Create Workflow

Create a new workflow.

**Endpoint:** `POST /api/workflows`

**Request Body:**
```json
{
  "name": "New Workflow",
  "description": "Workflow description",
  "nodes": [
    {
      "name": "Start",
      "type": "manual",
      "position": {"x": 250, "y": 300},
      "parameters": {}
    }
  ],
  "connections": {},
  "settings": {
    "executionOrder": "V1",
    "saveManualExecutions": true
  }
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5678/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Workflow",
    "description": "Test workflow",
    "nodes": [],
    "connections": {}
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-workflow-id",
    "name": "New Workflow",
    ...
  }
}
```

### Update Workflow

Update an existing workflow.

**Endpoint:** `PUT /api/workflows/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "active": true,
  "nodes": [...],
  "connections": {...}
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:5678/api/workflows/abc-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Workflow",
    "active": true
  }'
```

### Delete Workflow

Delete a workflow.

**Endpoint:** `DELETE /api/workflows/:id`

**Example Request:**
```bash
curl -X DELETE "http://localhost:5678/api/workflows/abc-123"
```

**Response:**
```json
{
  "success": true,
  "data": null
}
```

### Activate Workflow

Activate a workflow (enables triggers).

**Endpoint:** `POST /api/workflows/:id/activate`

**Example Request:**
```bash
curl -X POST "http://localhost:5678/api/workflows/abc-123/activate"
```

### Deactivate Workflow

Deactivate a workflow (disables triggers).

**Endpoint:** `POST /api/workflows/:id/deactivate`

**Example Request:**
```bash
curl -X POST "http://localhost:5678/api/workflows/abc-123/deactivate"
```

## Executions API

### List Executions

Get a list of workflow executions.

**Endpoint:** `GET /api/executions`

**Query Parameters:**
- `workflowId` (string, optional): Filter by workflow ID
- `status` (string, optional): Filter by status (NEW, RUNNING, SUCCESS, FAILED)
- `limit` (number, optional): Max results (default: 50)

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/executions?workflowId=abc-123&status=SUCCESS&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec-123",
      "workflowId": "abc-123",
      "mode": "MANUAL",
      "status": "SUCCESS",
      "data": {
        "resultData": {},
        "executionData": {}
      },
      "startedAt": "2024-01-15T10:00:00Z",
      "stoppedAt": "2024-01-15T10:00:05Z",
      "error": null
    }
  ]
}
```

### Get Execution by ID

Get a specific execution.

**Endpoint:** `GET /api/executions/:id`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/executions/exec-123"
```

### Execute Workflow

Manually execute a workflow.

**Endpoint:** `POST /api/executions`

**Request Body:**
```json
{
  "workflowId": "abc-123",
  "mode": "MANUAL",
  "data": {
    "customInput": "value"
  }
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5678/api/executions" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "abc-123",
    "mode": "MANUAL"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exec-456",
    "workflowId": "abc-123",
    "mode": "MANUAL",
    "status": "SUCCESS",
    "startedAt": "2024-01-15T10:00:00Z",
    "stoppedAt": "2024-01-15T10:00:05Z",
    "data": {
      "resultData": {
        "node-1": [
          {
            "json": {"result": "success"},
            "executedAt": "2024-01-15T10:00:05Z"
          }
        ]
      }
    }
  }
}
```

### Delete Execution

Delete an execution record.

**Endpoint:** `DELETE /api/executions/:id`

## Credentials API

### List Credentials

Get all credentials (data is masked).

**Endpoint:** `GET /api/credentials`

**Query Parameters:**
- `type` (string, optional): Filter by credential type

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/credentials?type=postgres"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cred-123",
      "name": "Production Database",
      "type": "postgres",
      "data": "***",
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### Get Credential by ID

Get a specific credential.

**Endpoint:** `GET /api/credentials/:id`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/credentials/cred-123"
```

### Create Credential

Create a new credential.

**Endpoint:** `POST /api/credentials`

**Request Body:**
```json
{
  "name": "My Database",
  "type": "postgres",
  "data": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "user": "postgres",
    "password": "secret"
  }
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5678/api/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production DB",
    "type": "postgres",
    "data": {
      "host": "db.example.com",
      "port": 5432,
      "database": "production",
      "user": "admin",
      "password": "secure_password"
    }
  }'
```

### Delete Credential

Delete a credential.

**Endpoint:** `DELETE /api/credentials/:id`

**Example Request:**
```bash
curl -X DELETE "http://localhost:5678/api/credentials/cred-123"
```

### Get Credential Types

Get all available credential types.

**Endpoint:** `GET /api/credentials/types`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/credentials/types"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "postgres",
      "displayName": "PostgreSQL",
      "properties": [
        {
          "name": "host",
          "displayName": "Host",
          "type": "string",
          "required": true,
          "default": "localhost"
        },
        {
          "name": "port",
          "displayName": "Port",
          "type": "number",
          "required": true,
          "default": 5432
        }
      ]
    }
  ]
}
```

## Nodes API

### List Available Nodes

Get all available node types.

**Endpoint:** `GET /api/nodes`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/nodes"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "httpRequest",
      "displayName": "HTTP Request",
      "description": "Makes an HTTP request and returns the response",
      "group": "ACTION",
      "version": 1,
      "defaults": {
        "name": "HTTP Request",
        "color": "#0088CC"
      },
      "inputs": ["main"],
      "outputs": ["main"],
      "properties": [...]
    }
  ]
}
```

### Get Node Type Details

Get details for a specific node type.

**Endpoint:** `GET /api/nodes/:type`

**Example Request:**
```bash
curl -X GET "http://localhost:5678/api/nodes/httpRequest"
```

## Webhooks API

### Trigger Webhook (POST)

Trigger a webhook with POST request.

**Endpoint:** `POST /webhook/:path`

**Example Request:**
```bash
curl -X POST "http://localhost:5678/webhook/my-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "userId": "123",
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exec-789",
    "workflowId": "abc-123",
    "status": "SUCCESS"
  }
}
```

### Trigger Webhook (GET)

Trigger a webhook with GET request.

**Endpoint:** `GET /webhook/:path`

**Query Parameters:** Any query parameters are passed to the workflow

**Example Request:**
```bash
curl -X GET "http://localhost:5678/webhook/my-workflow?userId=123&action=test"
```

## WebSocket API

### Real-time Execution Updates

Connect to WebSocket for real-time execution updates.

**Endpoint:** `WS /ws/executions`

**Example (JavaScript):**
```javascript
const ws = new WebSocket('ws://localhost:5678/ws/executions');

ws.onopen = () => {
  console.log('Connected to execution updates');
};

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Execution update:', update);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from execution updates');
};
```

## Error Responses

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Common HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for async processing
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Rate limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (number): Page number (1-indexed)
- `limit` (number): Items per page (max 100)

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 250,
    "page": 1,
    "pageSize": 50,
    "totalPages": 5
  }
}
```

## Examples

### Complete Workflow Creation Example

```bash
# 1. Create workflow
WORKFLOW_ID=$(curl -s -X POST "http://localhost:5678/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub to Slack",
    "description": "Post GitHub events to Slack",
    "nodes": [
      {
        "id": "webhook-1",
        "name": "GitHub Webhook",
        "type": "webhook",
        "position": {"x": 250, "y": 300},
        "parameters": {
          "httpMethod": "POST",
          "path": "github-events"
        }
      },
      {
        "id": "slack-1",
        "name": "Post to Slack",
        "type": "slack",
        "position": {"x": 500, "y": 300},
        "parameters": {
          "channel": "#github",
          "text": "New event: {{$json[\"action\"]}}"
        }
      }
    ],
    "connections": {
      "webhook-1": {
        "main": [
          [
            {"node": "slack-1", "type": "main", "index": 0}
          ]
        ]
      }
    }
  }' | jq -r '.data.id')

echo "Created workflow: $WORKFLOW_ID"

# 2. Create Slack credential
CRED_ID=$(curl -s -X POST "http://localhost:5678/api/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Bot",
    "type": "slackApi",
    "data": {
      "accessToken": "xoxb-your-token-here"
    }
  }' | jq -r '.data.id')

echo "Created credential: $CRED_ID"

# 3. Activate workflow
curl -X POST "http://localhost:5678/api/workflows/$WORKFLOW_ID/activate"

# 4. Test webhook
curl -X POST "http://localhost:5678/webhook/github-events" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "opened",
    "repository": "elide-dev/elide",
    "pull_request": {
      "title": "Add new feature"
    }
  }'
```

## SDK Examples

### Node.js/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:5678/api';

// Create workflow
const createWorkflow = async () => {
  const response = await axios.post(`${API_BASE}/workflows`, {
    name: 'My Workflow',
    description: 'Test workflow',
    nodes: [],
    connections: {}
  });

  return response.data.data;
};

// Execute workflow
const executeWorkflow = async (workflowId: string) => {
  const response = await axios.post(`${API_BASE}/executions`, {
    workflowId,
    mode: 'MANUAL'
  });

  return response.data.data;
};

// Get executions
const getExecutions = async (workflowId: string) => {
  const response = await axios.get(`${API_BASE}/executions`, {
    params: { workflowId, limit: 20 }
  });

  return response.data.data;
};
```

### Python

```python
import requests
import json

API_BASE = 'http://localhost:5678/api'

# Create workflow
def create_workflow():
    response = requests.post(f'{API_BASE}/workflows', json={
        'name': 'My Workflow',
        'description': 'Test workflow',
        'nodes': [],
        'connections': {}
    })

    return response.json()['data']

# Execute workflow
def execute_workflow(workflow_id):
    response = requests.post(f'{API_BASE}/executions', json={
        'workflowId': workflow_id,
        'mode': 'MANUAL'
    })

    return response.json()['data']

# Get executions
def get_executions(workflow_id):
    response = requests.get(f'{API_BASE}/executions', params={
        'workflowId': workflow_id,
        'limit': 20
    })

    return response.json()['data']
```

## Postman Collection

Import this Postman collection to test the API:

```json
{
  "info": {
    "name": "Elide Workflow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Workflows",
      "item": [
        {
          "name": "List Workflows",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/workflows"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5678/api"
    }
  ]
}
```

---

For more information, see the main [README.md](README.md) documentation.
