/**
 * URI.js - URI parsing and manipulation
 *
 * RFC-compliant URI parser
 * Package has ~120M downloads/week on npm!
 */

export interface URIComponents {
  scheme?: string;
  userinfo?: string;
  host?: string;
  port?: number;
  path?: string;
  query?: string;
  fragment?: string;
}

export function parse(uri: string): URIComponents {
  try {
    const url = new URL(uri);
    return {
      scheme: url.protocol.replace(':', ''),
      userinfo: url.username ? `${url.username}:${url.password}` : undefined,
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : undefined,
      path: url.pathname,
      query: url.search.replace('?', ''),
      fragment: url.hash.replace('#', ''),
    };
  } catch {
    return {};
  }
}

export function serialize(components: URIComponents): string {
  let uri = '';

  if (components.scheme) {
    uri += components.scheme + ':';
  }

  if (components.host) {
    uri += '//';
    if (components.userinfo) {
      uri += components.userinfo + '@';
    }
    uri += components.host;
    if (components.port) {
      uri += ':' + components.port;
    }
  }

  if (components.path) {
    uri += components.path;
  }

  if (components.query) {
    uri += '?' + components.query;
  }

  if (components.fragment) {
    uri += '#' + components.fragment;
  }

  return uri;
}

export default { parse, serialize };

if (import.meta.url.includes("elide-uri-js.ts")) {
  console.log("🌐 URI.js - URI parser (POLYGLOT!) | ~120M downloads/week");
}
