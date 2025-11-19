/**
 * React Server Components (RSC) Implementation for Elide
 *
 * Provides:
 * - Server component rendering
 * - Client component boundaries
 * - Streaming SSR
 * - Suspense support
 * - Server actions
 * - Flight protocol
 */

import { Transform, Readable } from 'stream';
import * as React from 'react';

export type ComponentType = 'server' | 'client' | 'shared';

export interface RSCPayload {
  type: 'component' | 'suspense' | 'error';
  id: string;
  props?: Record<string, any>;
  children?: RSCPayload[];
}

export interface ServerComponent {
  Component: React.ComponentType<any>;
  props: Record<string, any>;
  type: ComponentType;
}

/**
 * RSC Renderer - Core rendering engine
 */
export class RSCRenderer {
  private componentCache = new Map<string, any>();
  private flightData = new Map<string, any>();

  constructor(
    private env: 'development' | 'production' = 'production'
  ) {}

  /**
   * Render server component tree
   */
  async renderToFlight(
    component: React.ComponentType<any>,
    props: Record<string, any>
  ): Promise<string> {
    const payload = await this.serialize(component, props);
    return this.encodeFlightStream(payload);
  }

  /**
   * Render with streaming
   */
  renderToStream(
    component: React.ComponentType<any>,
    props: Record<string, any>
  ): ReadableStream {
    const self = this;

    return new ReadableStream({
      async start(controller) {
        try {
          const chunks = await self.serializeStreaming(component, props);

          for (const chunk of chunks) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  /**
   * Serialize component tree to RSC payload
   */
  private async serialize(
    component: React.ComponentType<any>,
    props: Record<string, any>,
    depth = 0
  ): Promise<RSCPayload> {
    const id = this.generateId(component, props);

    // Check cache
    if (this.componentCache.has(id)) {
      return this.componentCache.get(id);
    }

    // Render component
    let result: any;
    try {
      if (this.isAsyncComponent(component)) {
        result = await (component as any)(props);
      } else {
        result = component(props);
      }
    } catch (error) {
      return {
        type: 'error',
        id,
        props: { error: String(error) },
      };
    }

    // Handle different result types
    const payload = await this.serializeElement(result, depth);

    // Cache result
    this.componentCache.set(id, payload);

    return payload;
  }

  /**
   * Serialize React element
   */
  private async serializeElement(
    element: any,
    depth: number
  ): Promise<RSCPayload> {
    // Null/undefined
    if (element == null) {
      return {
        type: 'component',
        id: 'null',
      };
    }

    // Primitive values
    if (typeof element !== 'object') {
      return {
        type: 'component',
        id: 'primitive',
        props: { value: element },
      };
    }

    // React element
    if (element.$$typeof === Symbol.for('react.element')) {
      const { type, props } = element;

      // Client component boundary
      if (this.isClientComponent(type)) {
        return {
          type: 'component',
          id: this.getComponentName(type),
          props: await this.serializeProps(props),
        };
      }

      // Server component
      if (typeof type === 'function') {
        return this.serialize(type, props, depth + 1);
      }

      // Suspense boundary
      if (type === React.Suspense) {
        return {
          type: 'suspense',
          id: this.generateId(type, props),
          props: await this.serializeProps(props),
          children: props.children
            ? [await this.serializeElement(props.children, depth + 1)]
            : [],
        };
      }

      // Host component (div, span, etc.)
      return {
        type: 'component',
        id: String(type),
        props: await this.serializeProps(props),
        children: props.children
          ? await this.serializeChildren(props.children, depth + 1)
          : [],
      };
    }

    // Array of elements
    if (Array.isArray(element)) {
      const children = await Promise.all(
        element.map(child => this.serializeElement(child, depth))
      );
      return {
        type: 'component',
        id: 'fragment',
        children,
      };
    }

    return {
      type: 'component',
      id: 'unknown',
      props: { value: String(element) },
    };
  }

  /**
   * Serialize props
   */
  private async serializeProps(
    props: Record<string, any>
  ): Promise<Record<string, any>> {
    const serialized: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;

      // Handle functions (server actions)
      if (typeof value === 'function') {
        serialized[key] = this.serializeServerAction(value);
        continue;
      }

      // Handle promises
      if (value instanceof Promise) {
        serialized[key] = await value;
        continue;
      }

      // Handle React elements
      if (value?.$$typeof === Symbol.for('react.element')) {
        serialized[key] = await this.serializeElement(value, 0);
        continue;
      }

      // Regular values
      serialized[key] = value;
    }

    return serialized;
  }

  /**
   * Serialize children
   */
  private async serializeChildren(
    children: any,
    depth: number
  ): Promise<RSCPayload[]> {
    const childArray = React.Children.toArray(children);
    return Promise.all(
      childArray.map(child => this.serializeElement(child, depth))
    );
  }

  /**
   * Serialize server action
   */
  private serializeServerAction(fn: Function): string {
    // Generate unique ID for server action
    const id = 'action:' + this.hash(fn.toString());

    // Store action
    this.flightData.set(id, fn);

    return id;
  }

  /**
   * Encode as Flight protocol stream
   */
  private encodeFlightStream(payload: RSCPayload): string {
    // Flight protocol format: "id:type:data"
    const lines: string[] = [];

    const encode = (p: RSCPayload, parentId = '0') => {
      const id = `${parentId}.${p.id}`;
      lines.push(`${id}:${p.type}:${JSON.stringify(p.props || {})}`);

      if (p.children) {
        for (const child of p.children) {
          encode(child, id);
        }
      }
    };

    encode(payload);
    return lines.join('\n');
  }

  /**
   * Serialize with streaming support
   */
  private async *serializeStreaming(
    component: React.ComponentType<any>,
    props: Record<string, any>
  ): AsyncGenerator<string> {
    // Start with initial shell
    yield '<!DOCTYPE html><html><head>';
    yield '<meta charset="utf-8">';
    yield '<script type="module" src="/__elide_rsc_client__.js"></script>';
    yield '</head><body><div id="__elide_root__">';

    // Stream component chunks
    const payload = await this.serialize(component, props);
    const encoded = this.encodeFlightStream(payload);

    // Split into chunks for streaming
    const chunkSize = 1024;
    for (let i = 0; i < encoded.length; i += chunkSize) {
      yield encoded.slice(i, i + chunkSize);
      // Yield control for async operations
      await new Promise(resolve => setImmediate(resolve));
    }

    // Close tags
    yield '</div>';
    yield '<script>window.__ELIDE_RSC_DATA__ = ' +
          JSON.stringify(payload) +
          ';</script>';
    yield '</body></html>';
  }

  /**
   * Check if component is async
   */
  private isAsyncComponent(component: any): boolean {
    return component.constructor.name === 'AsyncFunction';
  }

  /**
   * Check if component is client component
   */
  private isClientComponent(component: any): boolean {
    // Check for 'use client' directive
    return component.$$typeof === Symbol.for('react.client.reference') ||
           component.$$client === true ||
           (component.__client__ === true);
  }

  /**
   * Get component name
   */
  private getComponentName(component: any): string {
    return component.displayName ||
           component.name ||
           'Component';
  }

  /**
   * Generate unique ID
   */
  private generateId(component: any, props: any): string {
    const name = this.getComponentName(component);
    const propsHash = this.hash(JSON.stringify(props));
    return `${name}_${propsHash}`;
  }

  /**
   * Simple hash function
   */
  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Server Actions
 */
export class ServerActions {
  private actions = new Map<string, Function>();

  /**
   * Register server action
   */
  register(fn: Function): string {
    const id = 'action_' + Math.random().toString(36).slice(2);
    this.actions.set(id, fn);
    return id;
  }

  /**
   * Execute server action
   */
  async execute(id: string, args: any[]): Promise<any> {
    const action = this.actions.get(id);
    if (!action) {
      throw new Error(`Server action not found: ${id}`);
    }

    return action(...args);
  }

  /**
   * Get action
   */
  get(id: string): Function | undefined {
    return this.actions.get(id);
  }
}

/**
 * Client Component Registry
 */
export class ClientComponentRegistry {
  private components = new Map<string, React.ComponentType<any>>();

  /**
   * Register client component
   */
  register(name: string, component: React.ComponentType<any>): void {
    this.components.set(name, component);
  }

  /**
   * Get client component
   */
  get(name: string): React.ComponentType<any> | undefined {
    return this.components.get(name);
  }

  /**
   * Generate manifest
   */
  generateManifest(): Record<string, string> {
    const manifest: Record<string, string> = {};

    for (const [name] of this.components) {
      manifest[name] = `/__elide_client__/${name}.js`;
    }

    return manifest;
  }
}

/**
 * RSC Cache
 */
export class RSCCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttl = 60000) {
    this.ttl = ttl;
  }

  /**
   * Get cached data
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Suspense boundary handler
 */
export class SuspenseBoundary {
  private pendingPromises = new Map<string, Promise<any>>();
  private fallbacks = new Map<string, React.ReactNode>();

  /**
   * Register suspense boundary
   */
  register(id: string, fallback: React.ReactNode): void {
    this.fallbacks.set(id, fallback);
  }

  /**
   * Track pending promise
   */
  track(id: string, promise: Promise<any>): void {
    this.pendingPromises.set(id, promise);
  }

  /**
   * Check if boundary has pending promises
   */
  hasPending(id: string): boolean {
    return this.pendingPromises.has(id);
  }

  /**
   * Get fallback
   */
  getFallback(id: string): React.ReactNode {
    return this.fallbacks.get(id) || null;
  }

  /**
   * Wait for all promises
   */
  async waitAll(): Promise<void> {
    await Promise.all(this.pendingPromises.values());
  }
}

export default RSCRenderer;
