/**
 * Email Worker Service (Ruby - Conceptual TypeScript Implementation)
 *
 * This service demonstrates how a Ruby service would use shared TypeScript utilities
 * via Elide's polyglot capabilities. Ruby is great for background workers and email
 * processing, and with Elide, it can use the same utilities as other services.
 *
 * Conceptual Ruby code:
 * ```ruby
 * # email-worker.rb (conceptual - Elide Ruby API is alpha)
 * require 'elide'
 * uuid_module = Elide.require('../shared/uuid.ts')
 * validator_module = Elide.require('../shared/validator.ts')
 *
 * def send_email(to, subject, body)
 *   return {error: "Invalid email"} unless validator_module.isEmail(to)
 *   email_id = uuid_module.v4()
 *   {emailId: email_id, to: to, status: "sent"}
 * end
 * ```
 */

import { v4 as uuidv4 } from '../shared/uuid.ts';
import { isEmail, isLength, trim } from '../shared/validator.ts';
import type { RequestContext, Response } from '../gateway/middleware.ts';

/**
 * Email interface
 */
interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  templateId?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

/**
 * Email template interface
 */
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
}

/**
 * In-memory stores
 */
const emails: Map<string, Email> = new Map();
const templates: Map<string, EmailTemplate> = new Map();

// Initialize with sample templates
function initTemplates() {
  const welcomeTemplate: EmailTemplate = {
    id: uuidv4(),
    name: 'welcome',
    subject: 'Welcome to {{appName}}!',
    body: 'Hi {{userName}}, welcome to our platform!',
    variables: ['appName', 'userName'],
    createdAt: new Date().toISOString(),
  };

  const resetTemplate: EmailTemplate = {
    id: uuidv4(),
    name: 'password-reset',
    subject: 'Reset your password',
    body: 'Click here to reset: {{resetLink}}',
    variables: ['resetLink'],
    createdAt: new Date().toISOString(),
  };

  templates.set(welcomeTemplate.id, welcomeTemplate);
  templates.set(resetTemplate.id, resetTemplate);
}

initTemplates();

/**
 * Send email
 *
 * In Ruby, this would use:
 * - validator_module.isEmail() for validating email addresses
 * - uuid_module.v4() for generating email IDs
 * - base64_module.encode() for encoding email content
 */
export async function sendEmail(
  ctx: RequestContext,
  data: {
    to: string;
    from?: string;
    subject: string;
    body: string;
    templateId?: string;
    variables?: Record<string, string>;
  }
): Promise<Response> {
  console.log(`[EmailService][Ruby] Sending email:`, data);

  // Validate email address using shared utility
  // Ruby: return {error: "Invalid email"} unless validator_module.isEmail(data[:to])
  if (!isEmail(data.to)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid recipient email address',
        note: 'Validated using shared TypeScript validator',
      },
    };
  }

  // Validate from email if provided
  const fromEmail = data.from || 'noreply@example.com';
  if (!isEmail(fromEmail)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid sender email address',
      },
    };
  }

  // Validate subject and body
  if (!data.subject || !isLength(data.subject, { min: 1, max: 200 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Subject must be 1-200 characters',
      },
    };
  }

  if (!data.body || !isLength(data.body, { min: 1, max: 10000 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Body must be 1-10000 characters',
      },
    };
  }

  // Process template if provided
  let subject = data.subject;
  let body = data.body;

  if (data.templateId) {
    const template = templates.get(data.templateId);
    if (template) {
      subject = renderTemplate(template.subject, data.variables || {});
      body = renderTemplate(template.body, data.variables || {});
    }
  }

  // Create email with UUID from shared utility
  // Ruby: email_id = uuid_module.v4()
  const email: Email = {
    id: uuidv4(),
    to: trim(data.to),
    from: trim(fromEmail),
    subject: trim(subject),
    body: trim(body),
    templateId: data.templateId,
    status: 'sent',
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };

  emails.set(email.id, email);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: {
        id: email.id,
        to: email.to,
        subject: email.subject,
        status: email.status,
        sentAt: email.sentAt,
      },
      message: 'Email sent successfully',
      polyglotNote: 'This Ruby service uses the same email validator as all other services',
    },
  };
}

/**
 * List email templates
 *
 * In Ruby, this would use:
 * - uuid_module.v4() for template IDs
 * - validator_module utilities for template validation
 */
export async function listTemplates(ctx: RequestContext): Promise<Response> {
  console.log(`[EmailService][Ruby] Listing templates`);

  const templateList = Array.from(templates.values()).map(t => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    variables: t.variables,
    createdAt: t.createdAt,
  }));

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      templates: templateList,
      total: templateList.length,
    },
  };
}

/**
 * Create email template
 *
 * In Ruby, this would use:
 * - uuid_module.v4() for generating template IDs
 * - validator_module.isLength() for validating template fields
 */
export async function createTemplate(
  ctx: RequestContext,
  data: { name: string; subject: string; body: string; variables?: string[] }
): Promise<Response> {
  console.log(`[EmailService][Ruby] Creating template:`, data);

  // Validate template data
  if (!data.name || !isLength(data.name, { min: 1, max: 50 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Template name must be 1-50 characters',
      },
    };
  }

  if (!data.subject || !isLength(data.subject, { min: 1, max: 200 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Subject must be 1-200 characters',
      },
    };
  }

  if (!data.body || !isLength(data.body, { min: 1, max: 10000 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Body must be 1-10000 characters',
      },
    };
  }

  // Ruby: template_id = uuid_module.v4()
  const template: EmailTemplate = {
    id: uuidv4(),
    name: trim(data.name),
    subject: trim(data.subject),
    body: trim(data.body),
    variables: data.variables || extractVariables(data.body),
    createdAt: new Date().toISOString(),
  };

  templates.set(template.id, template);

  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: {
      template,
      message: 'Template created successfully',
      polyglotNote: 'Ruby service using TypeScript utilities via Elide',
    },
  };
}

/**
 * Helper: Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}

/**
 * Helper: Extract variables from template
 */
function extractVariables(template: string): string[] {
  const matches = template.match(/{{([^}]+)}}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(2, -2));
}
