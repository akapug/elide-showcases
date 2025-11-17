/**
 * @elide/helmet - Permissions-Policy (formerly Feature-Policy)
 * Control browser features and APIs
 */

export interface PermissionsPolicyDirectives {
  accelerometer?: string[];
  'ambient-light-sensor'?: string[];
  autoplay?: string[];
  battery?: string[];
  camera?: string[];
  'display-capture'?: string[];
  'document-domain'?: string[];
  'encrypted-media'?: string[];
  fullscreen?: string[];
  geolocation?: string[];
  gyroscope?: string[];
  magnetometer?: string[];
  microphone?: string[];
  midi?: string[];
  payment?: string[];
  'picture-in-picture'?: string[];
  'publickey-credentials-get'?: string[];
  'screen-wake-lock'?: string[];
  'sync-xhr'?: string[];
  usb?: string[];
  'web-share'?: string[];
  'xr-spatial-tracking'?: string[];
  [key: string]: string[] | undefined;
}

export interface PermissionsPolicyOptions {
  directives?: PermissionsPolicyDirectives;
}

/**
 * Permissions-Policy middleware
 */
export function permissionsPolicy(options: PermissionsPolicyOptions = {}) {
  const { directives = {} } = options;

  const headerValue = buildPermissionsPolicyHeader(directives);

  return (req: any, res: any, next: any) => {
    if (headerValue) {
      res.setHeader('Permissions-Policy', headerValue);
    }
    next();
  };
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicyHeader(directives: PermissionsPolicyDirectives): string {
  const parts: string[] = [];

  for (const [feature, allowlist] of Object.entries(directives)) {
    if (!allowlist || allowlist.length === 0) {
      parts.push(`${feature}=()`);
      continue;
    }

    const origins = allowlist.map(origin => {
      if (origin === '*') return '*';
      if (origin === 'self') return 'self';
      return `"${origin}"`;
    });

    parts.push(`${feature}=(${origins.join(' ')})`);
  }

  return parts.join(', ');
}

/**
 * Strict permissions policy (disable all features)
 */
export function strictPermissions(): PermissionsPolicyOptions {
  return {
    directives: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: []
    }
  };
}
