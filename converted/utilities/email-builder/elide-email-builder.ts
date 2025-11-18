/**
 * Email Builder - HTML Email Builder
 *
 * Build responsive HTML emails easily.
 * **POLYGLOT SHOWCASE**: One email builder for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-builder (~20K+ downloads/week)
 */

export class EmailBuilder {
  private subject: string = '';
  private from: string = '';
  private to: string[] = [];
  private html: string = '';
  private text: string = '';

  setSubject(subject: string): this {
    this.subject = subject;
    return this;
  }

  setFrom(from: string): this {
    this.from = from;
    return this;
  }

  addRecipient(to: string): this {
    this.to.push(to);
    return this;
  }

  setHtml(html: string): this {
    this.html = html;
    return this;
  }

  setText(text: string): this {
    this.text = text;
    return this;
  }

  build() {
    return {
      subject: this.subject,
      from: this.from,
      to: this.to,
      html: this.html,
      text: this.text
    };
  }
}

export default EmailBuilder;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏗️  Email Builder - HTML Email Builder for Elide (POLYGLOT!)\n");

  const email = new EmailBuilder()
    .setSubject('Welcome!')
    .setFrom('noreply@example.com')
    .addRecipient('user@example.com')
    .setHtml('<h1>Welcome</h1>')
    .setText('Welcome')
    .build();

  console.log(email);

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
