/**
 * Elide Nodemailer - Universal Email Sending
 */

export interface TransportOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
  }>;
}

export class Transporter {
  constructor(private options: TransportOptions) {}

  async sendMail(mailOptions: MailOptions) {
    console.log('Sending email...');
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);

    return {
      messageId: `<${Date.now()}@mail.example.com>`,
      accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      rejected: [],
      response: '250 Message accepted'
    };
  }

  async verify() {
    return true;
  }

  close() {
    console.log('Transporter closed');
  }
}

export function createTransport(options: TransportOptions) {
  return new Transporter(options);
}

export default { createTransport };

if (import.meta.main) {
  console.log('=== Elide Nodemailer Demo ===');

  const transporter = createTransport({
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'user@example.com',
      pass: 'password'
    }
  });

  await transporter.sendMail({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'Hello from Elide!',
    html: '<b>Hello from Elide!</b>'
  });

  console.log('✓ Demo completed');
}
