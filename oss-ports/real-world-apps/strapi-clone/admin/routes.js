/**
 * Admin Panel Routes
 * HTTP routes for admin API
 */

import { Router } from '@elide/http';
import { AdminService } from './setup.js';
import { contentTypeBuilder } from '../content-types/builder.js';
import { AuthService } from '../auth/service.js';
import { PermissionService } from '../permissions/checker.js';
import { WebhookService } from '../webhooks/emitter.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export function setupAdminRoutes(config) {
  const router = new Router();
  const adminService = new AdminService();
  const authService = new AuthService(config.auth);
  const permissionService = new PermissionService();
  const webhookService = new WebhookService();

  // Public routes
  router.post('/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login(identifier, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  router.post('/register', async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Protected routes (require authentication)
  router.use(requireAuth);

  // Overview
  router.get('/', async (req, res) => {
    try {
      const overview = await adminService.getOverview();
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System info
  router.get('/system-info', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      const info = await adminService.getSystemInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Content Type Builder routes
  router.get('/content-types', async (req, res) => {
    try {
      const contentTypes = await contentTypeBuilder.findAll();
      res.json({ data: contentTypes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/content-types/:uid', async (req, res) => {
    try {
      const contentType = await contentTypeBuilder.findByUID(req.params.uid);
      if (!contentType) {
        return res.status(404).json({ error: 'Content type not found' });
      }
      res.json({ data: contentType });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/content-types', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      const contentType = await contentTypeBuilder.createContentType(req.body);
      res.status(201).json({ data: contentType });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/content-types/:uid', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      const contentType = await contentTypeBuilder.updateContentType(req.params.uid, req.body);
      res.json({ data: contentType });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/content-types/:uid', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await contentTypeBuilder.deleteContentType(req.params.uid);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Permission routes
  router.get('/permissions/roles/:roleId', async (req, res) => {
    try {
      const permissions = await permissionService.getPermissionsByRole(parseInt(req.params.roleId));
      res.json({ data: permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/permissions', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await permissionService.createPermission(req.body);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/permissions/:id', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await permissionService.updatePermission(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/permissions/:id', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await permissionService.deletePermission(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Webhook routes
  router.get('/webhooks', async (req, res) => {
    try {
      const webhooks = await webhookService.getAllWebhooks();
      res.json({ data: webhooks });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/webhooks', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await webhookService.createWebhook(req.body);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/webhooks/:id', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await webhookService.updateWebhook(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/webhooks/:id', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await webhookService.deleteWebhook(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/webhooks/:id/test', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await webhookService.testWebhook(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // API Token routes
  router.post('/api-tokens', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      const token = await authService.createAPIToken(req.body, req.user.id);
      res.status(201).json({ data: token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api-tokens/:id', requireRole('admin', 'super-admin'), async (req, res) => {
    try {
      await authService.revokeAPIToken(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // User management
  router.post('/change-password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Serve admin panel HTML (if enabled)
  if (config.admin?.serveAdminPanel !== false) {
    router.get('/*', (req, res) => {
      res.send(getAdminHTML());
    });
  }

  return router;
}

/**
 * Get admin panel HTML
 */
function getAdminHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elide CMS - Admin Panel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 900px;
      width: 90%;
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .feature {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .feature h3 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .feature p {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .endpoints {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .endpoints h3 {
      margin-bottom: 15px;
      color: #667eea;
    }
    .endpoint {
      display: flex;
      margin: 10px 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }
    .method {
      padding: 4px 8px;
      border-radius: 4px;
      margin-right: 10px;
      font-weight: bold;
      color: white;
      min-width: 60px;
      text-align: center;
    }
    .get { background: #4caf50; }
    .post { background: #2196f3; }
    .put { background: #ff9800; }
    .delete { background: #f44336; }
    .path {
      color: #333;
      padding: 4px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 5px;
      transition: background 0.3s;
    }
    .button:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Elide Headless CMS</h1>
    <p class="subtitle">Production-ready content management system built with Elide</p>

    <div class="features">
      <div class="feature">
        <h3>Content Type Builder</h3>
        <p>Create and manage content types with a flexible schema builder.</p>
      </div>
      <div class="feature">
        <h3>Auto-generated APIs</h3>
        <p>REST and GraphQL APIs automatically generated from your content types.</p>
      </div>
      <div class="feature">
        <h3>Role-based Access Control</h3>
        <p>Fine-grained permissions system with field-level access control.</p>
      </div>
      <div class="feature">
        <h3>Plugin System</h3>
        <p>Extend functionality with custom plugins and middleware.</p>
      </div>
      <div class="feature">
        <h3>Webhooks & Lifecycles</h3>
        <p>React to content changes with webhooks and lifecycle hooks.</p>
      </div>
      <div class="feature">
        <h3>Media Library</h3>
        <p>Upload and manage media files with support for multiple providers.</p>
      </div>
    </div>

    <div class="endpoints">
      <h3>Admin API Endpoints</h3>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/admin/login - Authenticate admin user</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/admin - Admin dashboard overview</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/admin/content-types - List all content types</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/admin/content-types - Create new content type</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/{content-type} - Query content entries</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/graphql - GraphQL API endpoint</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="/api" class="button">REST API</a>
      <a href="/graphql" class="button">GraphQL</a>
      <a href="/docs" class="button">Documentation</a>
    </div>

    <div class="footer">
      <p>Powered by <strong>Elide</strong> | Version 1.0.0</p>
      <p>High-performance polyglot runtime for modern applications</p>
    </div>
  </div>
</body>
</html>
  `;
}
