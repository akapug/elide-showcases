# Elide Workflow - Example Workflows

This document contains example workflows to help you get started.

## 1. GitHub Stars to Slack

Monitor GitHub repository stars and post updates to Slack.

**Nodes:**
1. Schedule Trigger (runs every hour)
2. HTTP Request (GET GitHub API)
3. Set (transform data)
4. IF (check if stars increased)
5. Slack (send notification)

**Configuration:**

```json
{
  "name": "GitHub Stars to Slack",
  "nodes": [
    {
      "name": "Hourly Check",
      "type": "schedule",
      "parameters": {
        "cronExpression": "0 * * * *"
      }
    },
    {
      "name": "Get Repo Stats",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.github.com/repos/elide-dev/elide"
      }
    },
    {
      "name": "Extract Stars",
      "type": "set",
      "parameters": {
        "values": {
          "repoName": "={{$json[\"name\"]}}",
          "stars": "={{$json[\"stargazers_count\"]}}",
          "url": "={{$json[\"html_url\"]}}"
        }
      }
    },
    {
      "name": "Post to Slack",
      "type": "slack",
      "parameters": {
        "channel": "#github-updates",
        "text": "⭐ {{$json[\"repoName\"]}} now has {{$json[\"stars\"]}} stars!"
      }
    }
  ]
}
```

## 2. Email to Database

Parse incoming emails and store in PostgreSQL.

**Nodes:**
1. Email Trigger (IMAP)
2. Function (parse email)
3. PostgreSQL (insert)
4. Email (send confirmation)

**Configuration:**

```json
{
  "name": "Email to Database",
  "nodes": [
    {
      "name": "Email Trigger",
      "type": "emailTrigger",
      "parameters": {
        "mailbox": "INBOX",
        "postProcessAction": "read"
      }
    },
    {
      "name": "Parse Email",
      "type": "function",
      "parameters": {
        "functionCode": "const subject = $json.subject;\nconst body = $json.body;\nconst from = $json.from;\n\nreturn [{\n  json: {\n    subject,\n    body,\n    from,\n    received_at: new Date().toISOString()\n  }\n}];"
      }
    },
    {
      "name": "Store in Database",
      "type": "postgres",
      "parameters": {
        "operation": "insert",
        "table": "emails"
      }
    },
    {
      "name": "Send Confirmation",
      "type": "email",
      "parameters": {
        "fromEmail": "noreply@example.com",
        "toEmail": "={{$json[\"from\"]}}",
        "subject": "Email Received",
        "text": "We received your email and it has been processed."
      }
    }
  ]
}
```

## 3. Webhook to Multiple Services

Receive webhook and distribute to multiple services.

**Nodes:**
1. Webhook Trigger
2. Set (transform data)
3. Split (into multiple branches)
4. Slack (branch 1)
5. Discord (branch 2)
6. PostgreSQL (branch 3)

**Configuration:**

```json
{
  "name": "Webhook Distribution",
  "nodes": [
    {
      "name": "Webhook",
      "type": "webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/events"
      }
    },
    {
      "name": "Transform Data",
      "type": "set",
      "parameters": {
        "values": {
          "eventType": "={{$json[\"type\"]}}",
          "message": "={{$json[\"message\"]}}",
          "timestamp": "={{new Date().toISOString()}}"
        }
      }
    },
    {
      "name": "Notify Slack",
      "type": "slack",
      "parameters": {
        "channel": "#events",
        "text": "New event: {{$json[\"eventType\"]}} - {{$json[\"message\"]}}"
      }
    },
    {
      "name": "Notify Discord",
      "type": "discord",
      "parameters": {
        "webhookUrl": "https://discord.com/api/webhooks/...",
        "text": "New event: {{$json[\"eventType\"]}}"
      }
    },
    {
      "name": "Log to Database",
      "type": "postgres",
      "parameters": {
        "operation": "insert",
        "table": "events"
      }
    }
  ]
}
```

## 4. API Aggregation

Fetch data from multiple APIs and combine.

**Nodes:**
1. Manual Trigger
2. HTTP Request (API 1)
3. HTTP Request (API 2)
4. HTTP Request (API 3)
5. Merge (combine data)
6. Function (process)
7. Google Sheets (export)

**Configuration:**

```json
{
  "name": "API Data Aggregator",
  "nodes": [
    {
      "name": "Start",
      "type": "manual"
    },
    {
      "name": "Fetch Weather",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.weather.com/v1/current"
      }
    },
    {
      "name": "Fetch Stock Prices",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.stocks.com/v1/prices"
      }
    },
    {
      "name": "Fetch News",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.news.com/v1/headlines"
      }
    },
    {
      "name": "Merge All Data",
      "type": "merge",
      "parameters": {
        "mode": "append"
      }
    },
    {
      "name": "Export to Sheets",
      "type": "googleSheets",
      "parameters": {
        "operation": "append",
        "spreadsheetId": "your-spreadsheet-id",
        "range": "A1:Z100"
      }
    }
  ]
}
```

## 5. Data Backup Pipeline

Backup data from MongoDB to cloud storage.

**Nodes:**
1. Schedule Trigger (daily at 2 AM)
2. MongoDB (query data)
3. Function (format as JSON)
4. Set (add metadata)
5. AWS S3 (upload)
6. Email (send report)

**Configuration:**

```json
{
  "name": "Daily MongoDB Backup",
  "nodes": [
    {
      "name": "Daily at 2 AM",
      "type": "schedule",
      "parameters": {
        "cronExpression": "0 2 * * *"
      }
    },
    {
      "name": "Fetch All Documents",
      "type": "mongodb",
      "parameters": {
        "operation": "find",
        "collection": "users",
        "limit": 10000
      }
    },
    {
      "name": "Format Data",
      "type": "function",
      "parameters": {
        "functionCode": "const backup = {\n  timestamp: new Date().toISOString(),\n  count: items.length,\n  data: items\n};\n\nreturn [{ json: backup }];"
      }
    },
    {
      "name": "Upload to S3",
      "type": "aws",
      "parameters": {
        "service": "s3",
        "operation": "upload",
        "bucket": "backups",
        "key": "mongodb/users-{{Date.now()}}.json"
      }
    },
    {
      "name": "Send Report",
      "type": "email",
      "parameters": {
        "fromEmail": "backup@example.com",
        "toEmail": "admin@example.com",
        "subject": "Backup Completed",
        "text": "MongoDB backup completed. {{$json[\"count\"]}} documents backed up."
      }
    }
  ]
}
```

## 6. Customer Onboarding

Automate customer onboarding with multiple steps.

**Nodes:**
1. Webhook (new customer)
2. Stripe (create customer)
3. PostgreSQL (insert user)
4. Email (welcome email)
5. Slack (notify team)
6. Wait (24 hours)
7. Email (follow-up)

**Configuration:**

```json
{
  "name": "Customer Onboarding",
  "nodes": [
    {
      "name": "New Signup",
      "type": "webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/signup"
      }
    },
    {
      "name": "Create Stripe Customer",
      "type": "stripe",
      "parameters": {
        "resource": "customer",
        "operation": "create"
      }
    },
    {
      "name": "Save to Database",
      "type": "postgres",
      "parameters": {
        "operation": "insert",
        "table": "users"
      }
    },
    {
      "name": "Send Welcome Email",
      "type": "email",
      "parameters": {
        "fromEmail": "welcome@example.com",
        "toEmail": "={{$json[\"email\"]}}",
        "subject": "Welcome to Our Platform!",
        "html": "<h1>Welcome!</h1><p>Thank you for joining us.</p>"
      }
    },
    {
      "name": "Notify Team",
      "type": "slack",
      "parameters": {
        "channel": "#new-customers",
        "text": "New customer: {{$json[\"email\"]}}"
      }
    },
    {
      "name": "Wait 24 Hours",
      "type": "wait",
      "parameters": {
        "resume": "after",
        "amount": 24,
        "unit": "hours"
      }
    },
    {
      "name": "Follow-up Email",
      "type": "email",
      "parameters": {
        "fromEmail": "support@example.com",
        "toEmail": "={{$json[\"email\"]}}",
        "subject": "How are you doing?",
        "text": "We wanted to check in and see if you have any questions."
      }
    }
  ]
}
```

## 7. Error Monitoring

Monitor application errors and alert team.

**Nodes:**
1. Webhook (error reports)
2. IF (severity check)
3. Set (format alert)
4. Slack (high priority)
5. Email (critical alerts)
6. PostgreSQL (log all errors)

**Configuration:**

```json
{
  "name": "Error Monitoring",
  "nodes": [
    {
      "name": "Error Webhook",
      "type": "webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/errors"
      }
    },
    {
      "name": "Check Severity",
      "type": "if",
      "parameters": {
        "conditions": {
          "field": "severity",
          "operation": "equals",
          "value": "critical"
        }
      }
    },
    {
      "name": "Alert Team (Slack)",
      "type": "slack",
      "parameters": {
        "channel": "#alerts",
        "text": "🚨 CRITICAL ERROR: {{$json[\"message\"]}}\nStack: {{$json[\"stack\"]}}"
      }
    },
    {
      "name": "Email On-Call",
      "type": "email",
      "parameters": {
        "fromEmail": "alerts@example.com",
        "toEmail": "oncall@example.com",
        "subject": "CRITICAL: Application Error",
        "text": "{{$json[\"message\"]}}"
      }
    },
    {
      "name": "Log Error",
      "type": "postgres",
      "parameters": {
        "operation": "insert",
        "table": "error_logs"
      }
    }
  ]
}
```

## 8. Content Publishing

Publish content to multiple platforms.

**Nodes:**
1. Manual Trigger
2. Read File (markdown file)
3. Function (convert to HTML)
4. Set (format for each platform)
5. HTTP Request (WordPress API)
6. HTTP Request (Medium API)
7. GitHub (create gist)

**Configuration:**

```json
{
  "name": "Multi-Platform Publisher",
  "nodes": [
    {
      "name": "Start",
      "type": "manual"
    },
    {
      "name": "Read Article",
      "type": "readFile",
      "parameters": {
        "filePath": "/content/article.md",
        "encoding": "utf8"
      }
    },
    {
      "name": "Convert to HTML",
      "type": "function",
      "parameters": {
        "functionCode": "// Use markdown parser\nconst html = convertMarkdown($json.content);\nreturn [{ json: { html } }];"
      }
    },
    {
      "name": "Publish to WordPress",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://example.com/wp-json/wp/v2/posts"
      }
    },
    {
      "name": "Publish to Medium",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.medium.com/v1/posts"
      }
    },
    {
      "name": "Create GitHub Gist",
      "type": "github",
      "parameters": {
        "resource": "gist",
        "operation": "create"
      }
    }
  ]
}
```

These examples demonstrate the versatility of Elide Workflow for various automation scenarios. Customize them to fit your specific needs!
