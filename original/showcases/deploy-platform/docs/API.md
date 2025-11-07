# Deploy Platform API Documentation

Complete REST API reference for the Deploy Platform.

## Base URL

```
https://api.deploy-platform.io
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "teams": ["team_xyz789"]
  }
}
```

#### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "teams": ["team_xyz789"]
  }
}
```

#### POST /auth/logout

Logout current user.

**Response:**
```json
{
  "message": "Logged out"
}
```

#### GET /auth/user

Get current user information.

**Response:**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "teams": ["team_xyz789"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Teams

#### GET /teams

List all teams for current user.

**Response:**
```json
[
  {
    "id": "team_xyz789",
    "name": "My Team",
    "slug": "my-team",
    "members": [
      {
        "userId": "usr_abc123",
        "role": "owner",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /teams

Create a new team.

**Request:**
```json
{
  "name": "My Team",
  "slug": "my-team"
}
```

**Response:**
```json
{
  "id": "team_xyz789",
  "name": "My Team",
  "slug": "my-team",
  "members": [
    {
      "userId": "usr_abc123",
      "role": "owner",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Projects

#### GET /projects

List all projects.

**Query Parameters:**
- `teamId` (optional): Filter by team

**Response:**
```json
[
  {
    "id": "prj_def456",
    "teamId": "team_xyz789",
    "name": "my-app",
    "slug": "my-app",
    "framework": "nextjs",
    "repository": "github.com/user/my-app",
    "branch": "main",
    "domains": ["myapp.com", "www.myapp.com"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /projects

Create a new project.

**Request:**
```json
{
  "teamId": "team_xyz789",
  "name": "my-app",
  "framework": "nextjs",
  "repository": "github.com/user/my-app",
  "branch": "main",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

**Response:**
```json
{
  "id": "prj_def456",
  "teamId": "team_xyz789",
  "name": "my-app",
  "slug": "my-app",
  "framework": "nextjs",
  "repository": "github.com/user/my-app",
  "branch": "main",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "environmentVariables": {},
  "domains": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /projects/:projectId

Get project details.

**Response:**
```json
{
  "id": "prj_def456",
  "teamId": "team_xyz789",
  "name": "my-app",
  "slug": "my-app",
  "framework": "nextjs",
  "repository": "github.com/user/my-app",
  "branch": "main",
  "environmentVariables": {
    "API_KEY": {
      "key": "API_KEY",
      "value": "***",
      "target": ["production", "preview"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  },
  "domains": [
    {
      "id": "dom_ghi789",
      "domain": "myapp.com",
      "verified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "verifiedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### PATCH /projects/:projectId

Update project settings.

**Request:**
```json
{
  "buildCommand": "npm run build:prod",
  "branch": "develop"
}
```

**Response:**
```json
{
  "id": "prj_def456",
  "teamId": "team_xyz789",
  "name": "my-app",
  "buildCommand": "npm run build:prod",
  "branch": "develop",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

#### DELETE /projects/:projectId

Delete a project.

**Response:**
```
204 No Content
```

### Deployments

#### GET /projects/:projectId/deployments

List deployments for a project.

**Response:**
```json
[
  {
    "id": "dpl_jkl012",
    "projectId": "prj_def456",
    "status": "ready",
    "url": "https://my-app-jkl012.deploy-platform.app",
    "alias": ["https://myapp.com"],
    "branch": "main",
    "commit": "a1b2c3d4e5f6",
    "commitMessage": "Add new feature",
    "source": "git",
    "buildTime": 15000,
    "deployTime": 5000,
    "createdAt": "2024-01-15T10:30:00Z",
    "deployedAt": "2024-01-15T10:31:00Z"
  }
]
```

#### POST /projects/:projectId/deployments

Create a new deployment.

**Request:**
```json
{
  "branch": "main",
  "commit": "a1b2c3d4e5f6",
  "commitMessage": "Deploy from CLI",
  "source": "cli"
}
```

**Response:**
```json
{
  "id": "dpl_jkl012",
  "projectId": "prj_def456",
  "status": "queued",
  "url": "https://my-app-jkl012.deploy-platform.app",
  "branch": "main",
  "commit": "a1b2c3d4e5f6",
  "commitMessage": "Deploy from CLI",
  "source": "cli",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /deployments/:deploymentId

Get deployment details.

**Response:**
```json
{
  "id": "dpl_jkl012",
  "projectId": "prj_def456",
  "teamId": "team_xyz789",
  "userId": "usr_abc123",
  "status": "ready",
  "url": "https://my-app-jkl012.deploy-platform.app",
  "alias": ["https://myapp.com"],
  "branch": "main",
  "commit": "a1b2c3d4e5f6",
  "commitMessage": "Add new feature",
  "source": "git",
  "buildTime": 15000,
  "deployTime": 5000,
  "createdAt": "2024-01-15T10:30:00Z",
  "buildStartedAt": "2024-01-15T10:30:05Z",
  "buildCompletedAt": "2024-01-15T10:30:20Z",
  "deployedAt": "2024-01-15T10:30:25Z"
}
```

#### POST /deployments/:deploymentId/cancel

Cancel a deployment.

**Response:**
```json
{
  "id": "dpl_jkl012",
  "status": "canceled"
}
```

#### POST /deployments/:deploymentId/promote

Promote deployment to production.

**Response:**
```json
{
  "id": "dpl_jkl012",
  "alias": ["https://myapp.com", "https://www.myapp.com"]
}
```

#### POST /deployments/:deploymentId/rollback

Rollback to this deployment.

**Response:**
```json
{
  "id": "dpl_new123",
  "projectId": "prj_def456",
  "status": "queued",
  "rollbackFrom": "dpl_current",
  "rollbackTo": "dpl_jkl012"
}
```

### Build Logs

#### GET /deployments/:deploymentId/logs

Get build logs for a deployment.

**Response:**
```json
[
  {
    "deploymentId": "dpl_jkl012",
    "timestamp": "2024-01-15T10:30:05Z",
    "level": "info",
    "message": "Cloning repository...",
    "source": "builder"
  },
  {
    "deploymentId": "dpl_jkl012",
    "timestamp": "2024-01-15T10:30:08Z",
    "level": "info",
    "message": "Installing dependencies...",
    "source": "builder"
  },
  {
    "deploymentId": "dpl_jkl012",
    "timestamp": "2024-01-15T10:30:15Z",
    "level": "info",
    "message": "Running build command...",
    "source": "builder"
  }
]
```

### Environment Variables

#### GET /projects/:projectId/env

List environment variables.

**Response:**
```json
[
  {
    "key": "API_KEY",
    "value": "***",
    "target": ["production", "preview"],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "key": "DATABASE_URL",
    "value": "***",
    "target": ["production"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /projects/:projectId/env

Add environment variable.

**Request:**
```json
{
  "key": "API_KEY",
  "value": "secret-key",
  "target": ["production", "preview"]
}
```

**Response:**
```json
{
  "key": "API_KEY",
  "value": "***",
  "target": ["production", "preview"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### PATCH /projects/:projectId/env/:key

Update environment variable.

**Request:**
```json
{
  "value": "new-secret-key",
  "target": ["production"]
}
```

**Response:**
```json
{
  "key": "API_KEY",
  "value": "***",
  "target": ["production"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### DELETE /projects/:projectId/env/:key

Delete environment variable.

**Response:**
```
204 No Content
```

### Domains

#### GET /projects/:projectId/domains

List custom domains.

**Response:**
```json
[
  {
    "id": "dom_ghi789",
    "domain": "myapp.com",
    "verified": true,
    "sslCertificate": "...",
    "createdAt": "2024-01-15T10:30:00Z",
    "verifiedAt": "2024-01-15T11:00:00Z"
  }
]
```

#### POST /projects/:projectId/domains

Add custom domain.

**Request:**
```json
{
  "domain": "myapp.com"
}
```

**Response:**
```json
{
  "id": "dom_ghi789",
  "domain": "myapp.com",
  "verified": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### DELETE /projects/:projectId/domains/:domainId

Remove custom domain.

**Response:**
```
204 No Content
```

#### POST /projects/:projectId/domains/:domainId/verify

Verify domain ownership.

**Response:**
```json
{
  "id": "dom_ghi789",
  "domain": "myapp.com",
  "verified": true,
  "verifiedAt": "2024-01-15T11:00:00Z"
}
```

### Analytics

#### GET /projects/:projectId/analytics

Get project analytics.

**Response:**
```json
{
  "totalDeployments": 42,
  "successfulDeployments": 38,
  "failedDeployments": 4,
  "averageBuildTime": 15000,
  "totalBandwidth": 5368709120,
  "totalRequests": 125000,
  "uniqueVisitors": 8542
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are rate limited:

- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1610712000
```

## Webhooks

Configure webhooks to receive deployment events:

### Events

- `deployment.created`: New deployment created
- `deployment.building`: Build started
- `deployment.ready`: Deployment ready
- `deployment.error`: Deployment failed
- `deployment.canceled`: Deployment canceled

### Webhook Payload

```json
{
  "event": "deployment.ready",
  "deployment": {
    "id": "dpl_jkl012",
    "projectId": "prj_def456",
    "status": "ready",
    "url": "https://my-app-jkl012.deploy-platform.app",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:31:00Z"
}
```

## SDKs

Official SDKs available:

- **JavaScript/TypeScript**: `@deploy-platform/sdk`
- **Python**: `deploy-platform`
- **Go**: `github.com/deploy-platform/sdk-go`
- **Ruby**: `deploy-platform`

### JavaScript Example

```javascript
import { DeployPlatform } from '@deploy-platform/sdk';

const client = new DeployPlatform({
  token: 'your-token'
});

const deployment = await client.deployments.create('prj_def456', {
  branch: 'main'
});

console.log(deployment.url);
```

### Python Example

```python
from deploy_platform import DeployPlatform

client = DeployPlatform(token='your-token')

deployment = client.deployments.create('prj_def456', {
    'branch': 'main'
})

print(deployment.url)
```
