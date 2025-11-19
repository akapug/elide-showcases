/**
 * White Label Manager - Comprehensive tenant customization
 *
 * Features:
 * - Custom branding (colors, logos, fonts)
 * - Custom domains with SSL
 * - Email template customization
 * - UI/UX customization
 * - Language/localization
 * - Custom CSS/themes
 * - Asset management
 *
 * @module white-label
 */

export interface BrandingConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    error: string;
    success: string;
    warning: string;
  };
  logo: {
    light: string;
    dark: string;
    favicon: string;
    appleTouchIcon?: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface CustomDomain {
  domain: string;
  tenantId: string;
  status: 'pending' | 'verifying' | 'active' | 'failed';
  sslStatus: 'pending' | 'provisioning' | 'active' | 'expired';
  verificationToken: string;
  sslCertificate?: {
    issuer: string;
    expiresAt: number;
    autoRenew: boolean;
  };
  dnsRecords: {
    type: string;
    name: string;
    value: string;
    verified: boolean;
  }[];
  createdAt: number;
  verifiedAt?: number;
}

export interface EmailTemplate {
  id: string;
  tenantId: string;
  type: 'welcome' | 'password_reset' | 'invoice' | 'notification' | 'custom';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UICustomization {
  tenantId: string;
  theme: 'light' | 'dark' | 'auto';
  customCSS?: string;
  layout: {
    sidebar: 'left' | 'right' | 'collapsed';
    header: 'fixed' | 'static';
    footer: 'visible' | 'hidden';
  };
  navigation: {
    style: 'tabs' | 'pills' | 'underline';
    position: 'top' | 'side';
  };
  components: Record<string, any>;
}

export interface LocalizationConfig {
  tenantId: string;
  defaultLocale: string;
  supportedLocales: string[];
  translations: Record<string, Record<string, string>>;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  timezone: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export interface Asset {
  id: string;
  tenantId: string;
  type: 'image' | 'video' | 'document' | 'font' | 'css' | 'js';
  name: string;
  url: string;
  cdnUrl?: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
  uploadedAt: number;
}

/**
 * White Label Manager
 * Handles all tenant customization and branding
 */
export class WhiteLabelManager {
  private branding: Map<string, BrandingConfig>;
  private domains: Map<string, CustomDomain>;
  private emailTemplates: Map<string, EmailTemplate[]>;
  private uiCustomizations: Map<string, UICustomization>;
  private localizations: Map<string, LocalizationConfig>;
  private assets: Map<string, Asset[]>;

  constructor() {
    this.branding = new Map();
    this.domains = new Map();
    this.emailTemplates = new Map();
    this.uiCustomizations = new Map();
    this.localizations = new Map();
    this.assets = new Map();
  }

  /**
   * Set tenant branding
   */
  setBranding(tenantId: string, config: Partial<BrandingConfig>): BrandingConfig {
    const existing = this.branding.get(tenantId) || this.getDefaultBranding();
    const updated = { ...existing, ...config };

    // Merge nested objects
    if (config.colors) {
      updated.colors = { ...existing.colors, ...config.colors };
    }
    if (config.logo) {
      updated.logo = { ...existing.logo, ...config.logo };
    }
    if (config.fonts) {
      updated.fonts = { ...existing.fonts, ...config.fonts };
    }

    this.branding.set(tenantId, updated);
    return updated;
  }

  /**
   * Get tenant branding
   */
  getBranding(tenantId: string): BrandingConfig {
    return this.branding.get(tenantId) || this.getDefaultBranding();
  }

  /**
   * Generate CSS from branding config
   */
  generateCSS(tenantId: string): string {
    const branding = this.getBranding(tenantId);

    return `
      :root {
        /* Colors */
        --color-primary: ${branding.colors.primary};
        --color-secondary: ${branding.colors.secondary};
        --color-accent: ${branding.colors.accent};
        --color-background: ${branding.colors.background};
        --color-text: ${branding.colors.text};
        --color-error: ${branding.colors.error};
        --color-success: ${branding.colors.success};
        --color-warning: ${branding.colors.warning};

        /* Fonts */
        --font-heading: ${branding.fonts.heading};
        --font-body: ${branding.fonts.body};
        --font-mono: ${branding.fonts.mono};

        /* Border Radius */
        --border-radius: ${this.getBorderRadiusValue(branding.borderRadius)};

        /* Spacing */
        --spacing-unit: ${this.getSpacingValue(branding.spacing)};
      }

      body {
        font-family: var(--font-body);
        color: var(--color-text);
        background-color: var(--color-background);
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }

      .btn-primary {
        background-color: var(--color-primary);
        border-radius: var(--border-radius);
      }

      .btn-secondary {
        background-color: var(--color-secondary);
        border-radius: var(--border-radius);
      }
    `.trim();
  }

  /**
   * Add custom domain
   */
  async addCustomDomain(
    tenantId: string,
    domain: string
  ): Promise<CustomDomain> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is already in use
    if (this.isDomainTaken(domain)) {
      throw new Error('Domain already in use');
    }

    const verificationToken = this.generateVerificationToken();

    const customDomain: CustomDomain = {
      domain,
      tenantId,
      status: 'pending',
      sslStatus: 'pending',
      verificationToken,
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain,
          value: 'app.example.com',
          verified: false
        },
        {
          type: 'TXT',
          name: `_verification.${domain}`,
          value: verificationToken,
          verified: false
        }
      ],
      createdAt: Date.now()
    };

    this.domains.set(domain, customDomain);

    // Start verification process
    await this.startDomainVerification(domain);

    return customDomain;
  }

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(domain: string): Promise<CustomDomain> {
    const customDomain = this.domains.get(domain);
    if (!customDomain) {
      throw new Error('Domain not found');
    }

    // Check DNS records
    const verified = await this.verifyDNSRecords(domain, customDomain.dnsRecords);

    if (verified) {
      customDomain.status = 'active';
      customDomain.verifiedAt = Date.now();

      // Provision SSL certificate
      await this.provisionSSL(domain);
    } else {
      customDomain.status = 'failed';
    }

    return customDomain;
  }

  /**
   * Remove custom domain
   */
  async removeCustomDomain(domain: string): Promise<void> {
    const customDomain = this.domains.get(domain);
    if (!customDomain) {
      throw new Error('Domain not found');
    }

    // Revoke SSL certificate
    if (customDomain.sslCertificate) {
      await this.revokeSSL(domain);
    }

    this.domains.delete(domain);
  }

  /**
   * Get custom domain
   */
  getCustomDomain(domain: string): CustomDomain | undefined {
    return this.domains.get(domain);
  }

  /**
   * Get custom domains by tenant
   */
  getCustomDomains(tenantId: string): CustomDomain[] {
    const domains: CustomDomain[] = [];
    for (const domain of this.domains.values()) {
      if (domain.tenantId === tenantId) {
        domains.push(domain);
      }
    }
    return domains;
  }

  /**
   * Create email template
   */
  createEmailTemplate(data: {
    tenantId: string;
    type: EmailTemplate['type'];
    subject: string;
    htmlContent: string;
    textContent?: string;
    variables?: string[];
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
  }): EmailTemplate {
    const template: EmailTemplate = {
      id: this.generateId('tpl'),
      tenantId: data.tenantId,
      type: data.type,
      subject: data.subject,
      htmlContent: data.htmlContent,
      textContent: data.textContent || this.htmlToText(data.htmlContent),
      variables: data.variables || this.extractVariables(data.htmlContent),
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!this.emailTemplates.has(data.tenantId)) {
      this.emailTemplates.set(data.tenantId, []);
    }

    this.emailTemplates.get(data.tenantId)!.push(template);
    return template;
  }

  /**
   * Update email template
   */
  updateEmailTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>
  ): EmailTemplate {
    const template = this.findEmailTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, updates, { updatedAt: Date.now() });

    // Re-extract variables if HTML changed
    if (updates.htmlContent) {
      template.variables = this.extractVariables(template.htmlContent);
    }

    return template;
  }

  /**
   * Get email template
   */
  getEmailTemplate(
    tenantId: string,
    type: EmailTemplate['type']
  ): EmailTemplate | undefined {
    const templates = this.emailTemplates.get(tenantId) || [];
    return templates.find(t => t.type === type);
  }

  /**
   * Render email template
   */
  renderEmailTemplate(
    templateId: string,
    variables: Record<string, any>
  ): { subject: string; html: string; text: string } {
    const template = this.findEmailTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Replace variables in template
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value));
      html = html.replace(regex, String(value));
      text = text.replace(regex, String(value));
    }

    return { subject, html, text };
  }

  /**
   * Set UI customization
   */
  setUICustomization(
    tenantId: string,
    customization: Partial<UICustomization>
  ): UICustomization {
    const existing = this.uiCustomizations.get(tenantId) || this.getDefaultUICustomization(tenantId);
    const updated = { ...existing, ...customization };

    if (customization.layout) {
      updated.layout = { ...existing.layout, ...customization.layout };
    }
    if (customization.navigation) {
      updated.navigation = { ...existing.navigation, ...customization.navigation };
    }

    this.uiCustomizations.set(tenantId, updated);
    return updated;
  }

  /**
   * Get UI customization
   */
  getUICustomization(tenantId: string): UICustomization {
    return this.uiCustomizations.get(tenantId) || this.getDefaultUICustomization(tenantId);
  }

  /**
   * Set localization config
   */
  setLocalization(
    tenantId: string,
    config: Partial<LocalizationConfig>
  ): LocalizationConfig {
    const existing = this.localizations.get(tenantId) || this.getDefaultLocalization(tenantId);
    const updated = { ...existing, ...config };

    if (config.translations) {
      updated.translations = { ...existing.translations, ...config.translations };
    }

    this.localizations.set(tenantId, updated);
    return updated;
  }

  /**
   * Get localization config
   */
  getLocalization(tenantId: string): LocalizationConfig {
    return this.localizations.get(tenantId) || this.getDefaultLocalization(tenantId);
  }

  /**
   * Upload asset
   */
  async uploadAsset(data: {
    tenantId: string;
    type: Asset['type'];
    name: string;
    file: Blob;
    metadata?: Record<string, any>;
  }): Promise<Asset> {
    // Upload to storage
    const url = await this.uploadToStorage(data.file, data.tenantId);
    const cdnUrl = await this.uploadToCDN(data.file, data.tenantId);

    const asset: Asset = {
      id: this.generateId('asset'),
      tenantId: data.tenantId,
      type: data.type,
      name: data.name,
      url,
      cdnUrl,
      size: data.file.size,
      mimeType: data.file.type,
      metadata: data.metadata,
      uploadedAt: Date.now()
    };

    if (!this.assets.has(data.tenantId)) {
      this.assets.set(data.tenantId, []);
    }

    this.assets.get(data.tenantId)!.push(asset);
    return asset;
  }

  /**
   * Get assets
   */
  getAssets(tenantId: string, type?: Asset['type']): Asset[] {
    const assets = this.assets.get(tenantId) || [];
    return type ? assets.filter(a => a.type === type) : assets;
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    for (const [tenantId, assets] of this.assets.entries()) {
      const index = assets.findIndex(a => a.id === assetId);
      if (index >= 0) {
        const asset = assets[index];
        await this.deleteFromStorage(asset.url);
        assets.splice(index, 1);
        break;
      }
    }
  }

  // Helper methods
  private getDefaultBranding(): BrandingConfig {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#8B5CF6',
        background: '#FFFFFF',
        text: '#1F2937',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B'
      },
      logo: {
        light: '/logo-light.svg',
        dark: '/logo-dark.svg',
        favicon: '/favicon.ico'
      },
      fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      borderRadius: 'md',
      spacing: 'comfortable'
    };
  }

  private getDefaultUICustomization(tenantId: string): UICustomization {
    return {
      tenantId,
      theme: 'light',
      layout: {
        sidebar: 'left',
        header: 'fixed',
        footer: 'visible'
      },
      navigation: {
        style: 'tabs',
        position: 'top'
      },
      components: {}
    };
  }

  private getDefaultLocalization(tenantId: string): LocalizationConfig {
    return {
      tenantId,
      defaultLocale: 'en-US',
      supportedLocales: ['en-US'],
      translations: {},
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      timezone: 'UTC',
      numberFormat: {
        decimal: '.',
        thousands: ','
      }
    };
  }

  private getBorderRadiusValue(size: BrandingConfig['borderRadius']): string {
    const values = {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px'
    };
    return values[size];
  }

  private getSpacingValue(spacing: BrandingConfig['spacing']): string {
    const values = {
      compact: '0.25rem',
      comfortable: '0.5rem',
      spacious: '1rem'
    };
    return values[spacing];
  }

  private isValidDomain(domain: string): boolean {
    const regex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return regex.test(domain);
  }

  private isDomainTaken(domain: string): boolean {
    return this.domains.has(domain);
  }

  private generateVerificationToken(): string {
    return `verify_${Math.random().toString(36).substr(2, 32)}`;
  }

  private async startDomainVerification(domain: string): Promise<void> {
    // Implementation would start async verification process
    console.log(`Starting verification for domain: ${domain}`);
  }

  private async verifyDNSRecords(
    domain: string,
    records: CustomDomain['dnsRecords']
  ): Promise<boolean> {
    // Implementation would verify actual DNS records
    return true;
  }

  private async provisionSSL(domain: string): Promise<void> {
    const customDomain = this.domains.get(domain);
    if (!customDomain) return;

    customDomain.sslStatus = 'provisioning';

    // Simulate SSL provisioning
    setTimeout(() => {
      if (customDomain) {
        customDomain.sslStatus = 'active';
        customDomain.sslCertificate = {
          issuer: "Let's Encrypt",
          expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
          autoRenew: true
        };
      }
    }, 1000);
  }

  private async revokeSSL(domain: string): Promise<void> {
    console.log(`Revoking SSL for domain: ${domain}`);
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private extractVariables(content: string): string[] {
    const regex = /{{\\s*([a-zA-Z0-9_]+)\\s*}}/g;
    const matches = content.matchAll(regex);
    return Array.from(matches, m => m[1]);
  }

  private findEmailTemplate(templateId: string): EmailTemplate | undefined {
    for (const templates of this.emailTemplates.values()) {
      const template = templates.find(t => t.id === templateId);
      if (template) return template;
    }
    return undefined;
  }

  private async uploadToStorage(file: Blob, tenantId: string): Promise<string> {
    return `https://storage.example.com/${tenantId}/${Date.now()}-${Math.random().toString(36).substr(2)}`;
  }

  private async uploadToCDN(file: Blob, tenantId: string): Promise<string> {
    return `https://cdn.example.com/${tenantId}/${Date.now()}-${Math.random().toString(36).substr(2)}`;
  }

  private async deleteFromStorage(url: string): Promise<void> {
    console.log(`Deleting from storage: ${url}`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
