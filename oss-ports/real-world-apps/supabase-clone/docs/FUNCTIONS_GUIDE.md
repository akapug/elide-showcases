# Functions Guide

Complete guide to Edge Functions in Elidebase.

## Table of Contents

- [Introduction](#introduction)
- [Creating Functions](#creating-functions)
- [Deploying Functions](#deploying-functions)
- [Invoking Functions](#invoking-functions)
- [Environment Variables](#environment-variables)
- [Database Access](#database-access)
- [HTTP Requests](#http-requests)
- [Scheduled Functions](#scheduled-functions)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Introduction

Edge Functions in Elidebase are serverless JavaScript functions that run close to your users. They provide:

- Server-side logic without managing servers
- Access to your Elidebase database
- HTTP request/response handling
- Environment variables and secrets
- Scheduled execution (cron jobs)
- Fast cold starts with GraalVM

## Creating Functions

### Basic Function

Create a new function file:

```javascript
// functions/hello.js

async function handler(req) {
    const { name } = JSON.parse(req.body || '{}');

    return Response.json({
        message: `Hello, ${name || 'World'}!`,
        timestamp: new Date().toISOString()
    });
}
```

### Function Structure

```javascript
async function handler(req) {
    // Request object contains:
    // - req.body: Request body as string
    // - req.headers: Request headers object
    // - req.method: HTTP method (GET, POST, etc.)

    // Your function logic here

    // Return Response object:
    // - Response.json(data, init): JSON response
    // - new Response(body, init): Custom response
}
```

### Request Object

```javascript
async function handler(req) {
    // Access request data
    const body = JSON.parse(req.body || '{}');
    const method = req.method;
    const headers = req.headers;

    console.log('Method:', method);
    console.log('Headers:', headers);
    console.log('Body:', body);

    return Response.json({ received: true });
}
```

### Response Object

```javascript
// JSON response
return Response.json({
    success: true,
    data: { id: 123 }
});

// JSON response with status code
return Response.json(
    { error: 'Not found' },
    { status: 404 }
);

// Custom response
return new Response('Hello World', {
    status: 200,
    headers: {
        'Content-Type': 'text/plain',
        'X-Custom-Header': 'value'
    }
});

// HTML response
return new Response('<h1>Hello</h1>', {
    headers: { 'Content-Type': 'text/html' }
});
```

## Deploying Functions

### Using CLI

```bash
# Deploy a function
elidebase functions deploy --name hello --file functions/hello.js

# Deploy all functions in directory
elidebase functions deploy --all --dir functions/

# Update existing function
elidebase functions deploy --name hello --file functions/hello.js

# Delete a function
elidebase functions delete --name hello
```

### Using SDK

```kotlin
val functionsRuntime = FunctionsRuntime(dbManager)

val result = functionsRuntime.deployFunction(
    name = "hello",
    sourceCode = File("functions/hello.js").readText(),
    runtime = "javascript",
    envVars = mapOf(
        "API_KEY" to "your-api-key"
    )
)

if (result.data != null) {
    println("Function deployed: ${result.data.name}")
}
```

### List Functions

```bash
elidebase functions list
```

Output:
```
Deployed Functions:
  - hello (JavaScript)
  - process-image (JavaScript)
  - send-email (JavaScript)
```

## Invoking Functions

### HTTP Request

```bash
curl -X POST https://yourapp.com/functions/hello \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "John"}'
```

### Using SDK

```kotlin
val result = client.functions.invoke(
    name = "hello",
    body = """{"name": "John"}""",
    headers = mapOf("Content-Type" to "application/json")
)

if (result.data != null) {
    println("Response: ${result.data.data}")
    println("Execution time: ${result.data.executionTime}ms")
}
```

### From Frontend

```javascript
async function callFunction(name, body) {
    const response = await fetch(`https://yourapp.com/functions/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
    });

    return await response.json();
}

// Usage
const result = await callFunction('hello', { name: 'John' });
console.log(result.message);
```

## Environment Variables

### Define Environment Variables

```javascript
// Access environment variables
async function handler(req) {
    const apiKey = env.API_KEY;
    const dbUrl = env.DATABASE_URL;

    return Response.json({
        hasApiKey: !!apiKey,
        hasDbUrl: !!dbUrl
    });
}
```

### Set Environment Variables

```bash
# Deploy with environment variables
elidebase functions deploy \
  --name api-client \
  --file functions/api-client.js \
  --env API_KEY=your-api-key \
  --env API_URL=https://api.example.com
```

Or in configuration:

```json
{
  "functions": {
    "api-client": {
      "env": {
        "API_KEY": "your-api-key",
        "API_URL": "https://api.example.com"
      }
    }
  }
}
```

### Secrets Management

For sensitive data, use encrypted secrets:

```kotlin
functionsRuntime.deployFunction(
    name = "payment-processor",
    sourceCode = functionCode,
    envVars = mapOf(
        "PUBLIC_KEY" to "pk_test_..."
    ),
    secrets = mapOf(
        "STRIPE_SECRET_KEY" to "sk_test_...",
        "WEBHOOK_SECRET" to "whsec_..."
    )
)
```

## Database Access

Functions have access to your Elidebase database:

### Query Data

```javascript
async function handler(req) {
    // Note: Database client would be injected
    // This is a conceptual example

    const { supabase } = globalThis;

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ todos: data });
}
```

### Insert Data

```javascript
async function handler(req) {
    const { supabase } = globalThis;
    const { title, description } = JSON.parse(req.body);

    const { data, error } = await supabase
        .from('todos')
        .insert({
            title,
            description,
            user_id: req.user.id
        })
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ todo: data }, { status: 201 });
}
```

### Call RPC Functions

```javascript
async function handler(req) {
    const { supabase } = globalThis;

    const { data, error } = await supabase
        .rpc('get_user_stats', {
            user_id: req.user.id
        });

    return Response.json({ stats: data });
}
```

## HTTP Requests

Make HTTP requests to external APIs:

### Fetch API

```javascript
async function handler(req) {
    // Fetch weather data
    const response = await fetch(
        `https://api.weather.com/forecast?city=${req.body.city}`,
        {
            headers: {
                'Authorization': `Bearer ${env.WEATHER_API_KEY}`
            }
        }
    );

    const weather = await response.json();

    return Response.json({ weather });
}
```

### POST Request

```javascript
async function handler(req) {
    const { email, subject, body } = JSON.parse(req.body);

    // Send email via external API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email }]
            }],
            from: { email: 'noreply@yourapp.com' },
            subject,
            content: [{
                type: 'text/plain',
                value: body
            }]
        })
    });

    if (!response.ok) {
        return Response.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }

    return Response.json({ sent: true });
}
```

## Scheduled Functions

Run functions on a schedule (cron jobs):

### Define Scheduled Function

```javascript
// functions/daily-digest.js

async function handler(req) {
    const { supabase } = globalThis;

    // Get yesterday's todos
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .gte('created_at', yesterday.toISOString());

    // Get users
    const { data: users } = await supabase
        .from('auth.users')
        .select('email');

    // Send digest email to each user
    for (const user of users) {
        await sendDigestEmail(user.email, todos);
    }

    return Response.json({
        processed: users.length,
        todos: todos.length
    });
}

async function sendDigestEmail(email, todos) {
    // Send email implementation
}
```

### Schedule Configuration

```json
{
  "functions": {
    "daily-digest": {
      "schedule": "0 9 * * *", // Every day at 9 AM
      "timezone": "UTC"
    },
    "cleanup-temp-files": {
      "schedule": "0 0 * * 0", // Every Sunday at midnight
      "timezone": "UTC"
    }
  }
}
```

### Cron Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday - Saturday)
│ │ │ │ │
* * * * *
```

Examples:
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 1 * *` - First day of every month

## Best Practices

### 1. Keep Functions Small

```javascript
// Good: Single responsibility
async function handler(req) {
    const { email } = JSON.parse(req.body);
    return await sendWelcomeEmail(email);
}

// Bad: Too much logic in one function
async function handler(req) {
    // Validate email
    // Check if user exists
    // Create user account
    // Send welcome email
    // Create default settings
    // Log activity
    // ... too much!
}
```

### 2. Error Handling

```javascript
async function handler(req) {
    try {
        const data = JSON.parse(req.body);

        // Validate input
        if (!data.email) {
            return Response.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Process request
        const result = await processEmail(data.email);

        return Response.json({ result });

    } catch (error) {
        console.error('Function error:', error);

        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

### 3. Timeout Handling

```javascript
async function handler(req) {
    // Set timeout for long operations
    const timeout = 25000; // 25 seconds
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    try {
        const result = await Promise.race([
            processLongOperation(),
            timeoutPromise
        ]);

        return Response.json({ result });
    } catch (error) {
        if (error.message === 'Timeout') {
            return Response.json(
                { error: 'Operation timed out' },
                { status: 504 }
            );
        }
        throw error;
    }
}
```

### 4. Caching

```javascript
const cache = new Map();

async function handler(req) {
    const { city } = JSON.parse(req.body);

    // Check cache
    if (cache.has(city)) {
        const cached = cache.get(city);
        if (Date.now() - cached.timestamp < 3600000) { // 1 hour
            return Response.json({ weather: cached.data, cached: true });
        }
    }

    // Fetch fresh data
    const weather = await fetchWeather(city);

    // Update cache
    cache.set(city, {
        data: weather,
        timestamp: Date.now()
    });

    return Response.json({ weather, cached: false });
}
```

### 5. Rate Limiting

```javascript
const rateLimits = new Map();

async function handler(req) {
    const userId = req.user?.id || req.headers['x-forwarded-for'];

    // Check rate limit
    const now = Date.now();
    const userLimits = rateLimits.get(userId) || [];

    // Remove old entries (older than 1 minute)
    const recentRequests = userLimits.filter(
        timestamp => now - timestamp < 60000
    );

    if (recentRequests.length >= 10) {
        return Response.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
        );
    }

    // Add new request
    recentRequests.push(now);
    rateLimits.set(userId, recentRequests);

    // Process request
    return processRequest(req);
}
```

## Examples

### Image Processing Function

```javascript
// functions/process-image.js

async function handler(req) {
    const { url, width, height, format = 'webp' } = JSON.parse(req.body);

    // Download image
    const response = await fetch(url);
    const imageBuffer = await response.arrayBuffer();

    // Process image (conceptual - would use actual image library)
    const processed = await processImage(imageBuffer, {
        width,
        height,
        format
    });

    // Upload to storage
    const { supabase } = globalThis;
    const path = `processed/${Date.now()}.${format}`;

    await supabase.storage
        .from('images')
        .upload(path, processed);

    const publicUrl = supabase.storage
        .from('images')
        .getPublicUrl(path);

    return Response.json({
        url: publicUrl.data.publicUrl,
        size: processed.byteLength
    });
}
```

### Webhook Handler

```javascript
// functions/stripe-webhook.js

async function handler(req) {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const event = verifyStripeWebhook(payload, signature, env.WEBHOOK_SECRET);

    if (!event) {
        return Response.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    // Handle different event types
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data);
            break;

        case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data);
            break;

        case 'customer.subscription.deleted':
            await handleSubscriptionCanceled(event.data);
            break;
    }

    return Response.json({ received: true });
}

async function handlePaymentSuccess(data) {
    const { supabase } = globalThis;

    await supabase
        .from('payments')
        .insert({
            stripe_payment_id: data.object.id,
            amount: data.object.amount,
            status: 'succeeded'
        });
}
```

### Email Template Function

```javascript
// functions/send-email.js

async function handler(req) {
    const { to, template, data } = JSON.parse(req.body);

    // Load email template
    const html = await renderTemplate(template, data);

    // Send email
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: env.FROM_EMAIL },
            subject: getSubject(template),
            content: [{ type: 'text/html', value: html }]
        })
    });

    return Response.json({
        sent: response.ok,
        status: response.status
    });
}

function renderTemplate(template, data) {
    const templates = {
        'welcome': (data) => `
            <h1>Welcome ${data.name}!</h1>
            <p>Thanks for signing up.</p>
        `,
        'password-reset': (data) => `
            <h1>Password Reset</h1>
            <p>Click here to reset: ${data.resetUrl}</p>
        `
    };

    return templates[template](data);
}
```

### Data Aggregation Function

```javascript
// functions/calculate-stats.js

async function handler(req) {
    const { supabase } = globalThis;
    const { userId } = JSON.parse(req.body);

    // Parallel queries for better performance
    const [todos, completedTodos, overdueTodos] = await Promise.all([
        supabase.from('todos').select('id').eq('user_id', userId),
        supabase.from('todos').select('id').eq('user_id', userId).eq('completed', true),
        supabase.from('todos').select('id').eq('user_id', userId).lt('due_date', new Date().toISOString())
    ]);

    return Response.json({
        total: todos.data.length,
        completed: completedTodos.data.length,
        overdue: overdueTodos.data.length,
        completionRate: (completedTodos.data.length / todos.data.length * 100).toFixed(1)
    });
}
```

### Batch Processing Function

```javascript
// functions/batch-process.js

async function handler(req) {
    const { supabase } = globalThis;

    // Get unprocessed items
    const { data: items } = await supabase
        .from('queue')
        .select('*')
        .eq('processed', false)
        .limit(100);

    const results = [];

    // Process in batches of 10
    for (let i = 0; i < items.length; i += 10) {
        const batch = items.slice(i, i + 10);

        const batchResults = await Promise.all(
            batch.map(item => processItem(item))
        );

        results.push(...batchResults);
    }

    // Mark as processed
    await supabase
        .from('queue')
        .update({ processed: true })
        .in('id', items.map(item => item.id));

    return Response.json({
        processed: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
    });
}
```

## Debugging

### Function Logs

```bash
# View function logs
elidebase functions logs --name hello --limit 100

# Follow logs in real-time
elidebase functions logs --name hello --follow

# Filter by status
elidebase functions logs --name hello --status ERROR
```

### Console Logging

```javascript
async function handler(req) {
    console.log('Request received:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    const result = await processRequest(req);

    console.log('Result:', result);

    return Response.json(result);
}
```

### Error Tracking

```javascript
async function handler(req) {
    try {
        return await processRequest(req);
    } catch (error) {
        // Log detailed error
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            request: {
                method: req.method,
                headers: req.headers,
                body: req.body
            }
        });

        // Send to error tracking service
        await reportError(error, req);

        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

## Next Steps

- [Database Guide](DATABASE_GUIDE.md)
- [Authentication Guide](AUTH_GUIDE.md)
- [Storage Guide](STORAGE_GUIDE.md)
- [Real-time Guide](REALTIME_GUIDE.md)
