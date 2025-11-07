/**
 * Email Service (TypeScript wrapper for Ruby service)
 *
 * In a real polyglot environment, this would call a Ruby service
 * that handles email notifications. The Ruby service would import
 * and use the shared TypeScript utilities through Elide's polyglot runtime.
 *
 * Conceptual Ruby implementation (email_service.rb):
 *
 * ```ruby
 * require 'elide'
 * require 'mail'
 *
 * # Import shared TypeScript utilities
 * uuid = Elide.require('../shared/uuid.ts')
 * validator = Elide.require('../shared/validator.ts')
 * marked = Elide.require('../shared/marked.ts')
 *
 * class EmailService
 *   def send_order_confirmation(order_data)
 *     # Generate email ID using shared UUID
 *     email_id = uuid.v4()
 *
 *     # Validate email using shared validator
 *     unless validator.isEmail(order_data['customerEmail'])
 *       raise ArgumentError, 'Invalid email address'
 *     end
 *
 *     # Generate HTML content from markdown
 *     markdown_content = generate_order_email_markdown(order_data)
 *     html_content = marked.parse(markdown_content)
 *
 *     # Send email
 *     Mail.deliver do
 *       from     'orders@elideshop.com'
 *       to       order_data['customerEmail']
 *       subject  "Order Confirmation - #{order_data['orderNumber']}"
 *       html_part do
 *         content_type 'text/html; charset=UTF-8'
 *         body html_content
 *       end
 *     end
 *
 *     {
 *       success: true,
 *       emailId: email_id,
 *       recipient: order_data['customerEmail']
 *     }
 *   end
 * end
 * ```
 */

import { v4 as uuidv4 } from '../../shared/uuid.ts';
import { isEmail } from '../../shared/validator.ts';
import { nanoid } from '../../shared/nanoid.ts';

export interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
  shippingAddress: any;
}

export interface EmailResult {
  success: boolean;
  emailId: string;
  recipient: string;
  sentAt: Date;
  provider: string;
}

/**
 * Send order confirmation email (conceptual Ruby service wrapper)
 */
export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<EmailResult> {
  console.log('[Email Service] Sending order confirmation...');
  console.log(`  Order: ${data.orderNumber}`);
  console.log(`  Recipient: ${data.customerEmail}`);

  // Validate email using shared validator
  if (!isEmail(data.customerEmail)) {
    throw new Error('Invalid email address');
  }

  // Generate email ID using shared UUID and nanoid
  const emailId = `email-${nanoid(10)}`;
  const trackingId = uuidv4();

  // Simulate email sending (in real app, this calls Ruby service)
  await simulateEmailSending();

  console.log(`[Email Service] ✓ Email sent: ${emailId}`);

  return {
    success: true,
    emailId,
    recipient: data.customerEmail,
    sentAt: new Date(),
    provider: 'Ruby Email Service',
  };
}

/**
 * Send shipping notification (conceptual)
 */
export async function sendShippingNotification(data: {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  trackingNumber: string;
  carrier: string;
}): Promise<EmailResult> {
  console.log('[Email Service] Sending shipping notification...');
  console.log(`  Order: ${data.orderNumber}`);
  console.log(`  Tracking: ${data.trackingNumber}`);

  if (!isEmail(data.customerEmail)) {
    throw new Error('Invalid email address');
  }

  const emailId = `email-${nanoid(10)}`;
  await simulateEmailSending();

  console.log(`[Email Service] ✓ Shipping notification sent: ${emailId}`);

  return {
    success: true,
    emailId,
    recipient: data.customerEmail,
    sentAt: new Date(),
    provider: 'Ruby Email Service',
  };
}

/**
 * Send promotional email (conceptual)
 */
export async function sendPromotionalEmail(data: {
  recipients: string[];
  subject: string;
  content: string;
  campaignId: string;
}): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  campaignId: string;
}> {
  console.log('[Email Service] Sending promotional campaign...');
  console.log(`  Campaign: ${data.campaignId}`);
  console.log(`  Recipients: ${data.recipients.length}`);

  // Validate all emails
  const validEmails = data.recipients.filter(isEmail);

  await simulateEmailSending();

  console.log(`[Email Service] ✓ Campaign sent to ${validEmails.length} recipients`);

  return {
    success: true,
    sentCount: validEmails.length,
    failedCount: data.recipients.length - validEmails.length,
    campaignId: data.campaignId,
  };
}

/**
 * Get email templates (conceptual)
 */
export async function getEmailTemplates(): Promise<Array<{
  id: string;
  name: string;
  subject: string;
  type: string;
}>> {
  return [
    {
      id: 'order-confirmation',
      name: 'Order Confirmation',
      subject: 'Your order has been confirmed',
      type: 'transactional',
    },
    {
      id: 'shipping-notification',
      name: 'Shipping Notification',
      subject: 'Your order has shipped',
      type: 'transactional',
    },
    {
      id: 'delivery-confirmation',
      name: 'Delivery Confirmation',
      subject: 'Your order has been delivered',
      type: 'transactional',
    },
    {
      id: 'promotional',
      name: 'Promotional Email',
      subject: 'Special offer just for you',
      type: 'marketing',
    },
  ];
}

/**
 * Generate email content (conceptual)
 */
export function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${item.productName}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #667eea; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; text-align: right; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order, ${data.customerName}!</p>
        </div>
        <div class="content">
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <h2>Order Details</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p class="total">Total: $${data.total.toFixed(2)}</p>
          <h3>Shipping Address</h3>
          <p>
            ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
            ${data.shippingAddress.address}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}
          </p>
        </div>
        <div class="footer">
          <p>This email was sent by ElideShop's Ruby email service</p>
          <p>Powered by Elide's polyglot runtime</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Simulate email sending delay
 */
async function simulateEmailSending(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300));
}
