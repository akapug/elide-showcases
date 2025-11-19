/**
 * @elide/helmet - Expect-CT
 * Certificate Transparency
 */

export interface ExpectCTOptions {
  maxAge?: number;
  enforce?: boolean;
  reportUri?: string;
}

/**
 * Expect-CT middleware
 */
export function expectCt(options: ExpectCTOptions = {}) {
  const { maxAge = 0, enforce = false, reportUri } = options;

  let headerValue = `max-age=${Math.floor(maxAge)}`;

  if (enforce) {
    headerValue += ', enforce';
  }

  if (reportUri) {
    headerValue += `, report-uri="${reportUri}"`;
  }

  return (req: any, res: any, next: any) => {
    res.setHeader('Expect-CT', headerValue);
    next();
  };
}
