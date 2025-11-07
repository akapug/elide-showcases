/**
 * ElideHTML - HTMX Helpers
 *
 * Type-safe builders for htmx attributes and patterns.
 * Makes htmx feel native to the template system.
 */

export interface HtmxAttrs {
  // Core htmx attributes
  'hx-get'?: string;
  'hx-post'?: string;
  'hx-put'?: string;
  'hx-patch'?: string;
  'hx-delete'?: string;

  // Targeting
  'hx-target'?: string;
  'hx-swap'?: HxSwap;
  'hx-select'?: string;
  'hx-select-oob'?: string;

  // Triggers
  'hx-trigger'?: string;

  // Indicators
  'hx-indicator'?: string;

  // History
  'hx-push-url'?: string | boolean;
  'hx-replace-url'?: string | boolean;
  'hx-boost'?: boolean;

  // Headers
  'hx-headers'?: string;

  // Validation
  'hx-validate'?: boolean;

  // Extensions
  'hx-ext'?: string;

  // Other
  'hx-confirm'?: string;
  'hx-disable'?: boolean;
  'hx-disabled-elt'?: string;
  'hx-encoding'?: string;
  'hx-include'?: string;
  'hx-params'?: string;
  'hx-preserve'?: boolean;
  'hx-prompt'?: string;
  'hx-sync'?: string;
  'hx-vals'?: string;
}

export type HxSwap =
  | 'innerHTML'
  | 'outerHTML'
  | 'beforebegin'
  | 'afterbegin'
  | 'beforeend'
  | 'afterend'
  | 'delete'
  | 'none';

/**
 * HTMX attribute builder with fluent API
 */
export class HxBuilder {
  private attrs: Record<string, any> = {};

  /**
   * HTTP Methods
   */
  get(url: string): this {
    this.attrs['hx-get'] = url;
    return this;
  }

  post(url: string): this {
    this.attrs['hx-post'] = url;
    return this;
  }

  put(url: string): this {
    this.attrs['hx-put'] = url;
    return this;
  }

  patch(url: string): this {
    this.attrs['hx-patch'] = url;
    return this;
  }

  delete(url: string): this {
    this.attrs['hx-delete'] = url;
    return this;
  }

  /**
   * Targeting
   */
  target(selector: string): this {
    this.attrs['hx-target'] = selector;
    return this;
  }

  swap(mode: HxSwap): this {
    this.attrs['hx-swap'] = mode;
    return this;
  }

  select(selector: string): this {
    this.attrs['hx-select'] = selector;
    return this;
  }

  selectOob(selector: string): this {
    this.attrs['hx-select-oob'] = selector;
    return this;
  }

  /**
   * Triggers
   */
  trigger(trigger: string): this {
    this.attrs['hx-trigger'] = trigger;
    return this;
  }

  // Common trigger patterns
  triggerLoad(): this {
    return this.trigger('load');
  }

  triggerReveal(): this {
    return this.trigger('revealed');
  }

  triggerIntersect(options?: { threshold?: number; root?: string }): this {
    if (options) {
      const opts = Object.entries(options)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      return this.trigger(`intersect ${opts}`);
    }
    return this.trigger('intersect');
  }

  triggerEvery(interval: string): this {
    return this.trigger(`every ${interval}`);
  }

  triggerChanged(): this {
    return this.trigger('change');
  }

  triggerDelayed(delay: string): this {
    return this.trigger(`keyup changed delay:${delay}`);
  }

  /**
   * Indicators
   */
  indicator(selector: string): this {
    this.attrs['hx-indicator'] = selector;
    return this;
  }

  /**
   * History
   */
  pushUrl(url?: string | boolean): this {
    this.attrs['hx-push-url'] = url === undefined ? true : url;
    return this;
  }

  replaceUrl(url?: string | boolean): this {
    this.attrs['hx-replace-url'] = url === undefined ? true : url;
    return this;
  }

  boost(): this {
    this.attrs['hx-boost'] = true;
    return this;
  }

  /**
   * Validation
   */
  validate(): this {
    this.attrs['hx-validate'] = true;
    return this;
  }

  /**
   * Other common patterns
   */
  confirm(message: string): this {
    this.attrs['hx-confirm'] = message;
    return this;
  }

  include(selector: string): this {
    this.attrs['hx-include'] = selector;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.attrs['hx-headers'] = JSON.stringify(headers);
    return this;
  }

  vals(vals: Record<string, any>): this {
    this.attrs['hx-vals'] = JSON.stringify(vals);
    return this;
  }

  ext(extensions: string): this {
    this.attrs['hx-ext'] = extensions;
    return this;
  }

  sync(sync: string): this {
    this.attrs['hx-sync'] = sync;
    return this;
  }

  /**
   * Merge with other attributes
   */
  merge(otherAttrs: Record<string, any>): this {
    Object.assign(this.attrs, otherAttrs);
    return this;
  }

  /**
   * Build final attributes object
   */
  build(): Record<string, any> {
    return { ...this.attrs };
  }
}

/**
 * Create a new htmx attribute builder
 */
export function hx(): HxBuilder {
  return new HxBuilder();
}

/**
 * Common htmx patterns as functions
 */
export const htmx = {
  /**
   * Infinite scroll pattern
   */
  infiniteScroll(loadUrl: string, threshold = 0.8): Record<string, any> {
    return hx()
      .get(loadUrl)
      .trigger(`intersect threshold:${threshold}`)
      .swap('beforeend')
      .build();
  },

  /**
   * Live search pattern
   */
  liveSearch(searchUrl: string, delay = '500ms'): Record<string, any> {
    return hx()
      .get(searchUrl)
      .trigger(`keyup changed delay:${delay}`)
      .target('#search-results')
      .swap('innerHTML')
      .build();
  },

  /**
   * Delete with confirmation
   */
  deleteWithConfirm(url: string, message = 'Are you sure?'): Record<string, any> {
    return hx().delete(url).confirm(message).swap('outerHTML').build();
  },

  /**
   * Auto-refresh pattern
   */
  autoRefresh(url: string, interval = '5s'): Record<string, any> {
    return hx().get(url).trigger(`every ${interval}`).swap('innerHTML').build();
  },

  /**
   * Lazy load pattern
   */
  lazyLoad(url: string): Record<string, any> {
    return hx().get(url).triggerLoad().swap('outerHTML').build();
  },

  /**
   * Form with validation
   */
  form(action: string, method: 'post' | 'put' | 'patch' = 'post'): Record<string, any> {
    const builder = hx().validate().swap('outerHTML');

    if (method === 'post') builder.post(action);
    else if (method === 'put') builder.put(action);
    else if (method === 'patch') builder.patch(action);

    return builder.build();
  },

  /**
   * Out of band swap
   */
  oob(id: string, swap: HxSwap = 'innerHTML'): Record<string, any> {
    return {
      id,
      'hx-swap-oob': swap,
    };
  },

  /**
   * Poll for updates
   */
  poll(url: string, interval = '2s'): Record<string, any> {
    return hx().get(url).triggerEvery(interval).swap('innerHTML').build();
  },

  /**
   * Click to load more
   */
  loadMore(url: string, target = 'this'): Record<string, any> {
    return hx().get(url).target(target).swap('outerHTML').build();
  },

  /**
   * Active search (search-as-you-type)
   */
  activeSearch(url: string, delay = '300ms'): Record<string, any> {
    return hx()
      .post(url)
      .trigger(`keyup changed delay:${delay}`)
      .target('#search-results')
      .swap('innerHTML')
      .include('[name="q"]')
      .build();
  },

  /**
   * Inline edit pattern
   */
  inlineEdit(getUrl: string, postUrl: string): {
    view: Record<string, any>;
    edit: Record<string, any>;
  } {
    return {
      view: hx().get(getUrl).swap('outerHTML').build(),
      edit: hx().post(postUrl).swap('outerHTML').build(),
    };
  },

  /**
   * Dependent dropdown
   */
  dependentSelect(url: string, targetId: string): Record<string, any> {
    return hx()
      .get(url)
      .trigger('change')
      .target(`#${targetId}`)
      .swap('innerHTML')
      .build();
  },

  /**
   * Modal/dialog pattern
   */
  modal(url: string, targetId = '#modal'): Record<string, any> {
    return hx().get(url).target(targetId).swap('innerHTML').build();
  },

  /**
   * Typeahead/autocomplete
   */
  typeahead(url: string, delay = '200ms'): Record<string, any> {
    return hx()
      .post(url)
      .trigger(`keyup changed delay:${delay}`)
      .target('#typeahead-results')
      .swap('innerHTML')
      .build();
  },
};

/**
 * SSE (Server-Sent Events) helpers
 */
export function hxSse(connectUrl: string, swap: string): Record<string, any> {
  return {
    'hx-ext': 'sse',
    'sse-connect': connectUrl,
    'sse-swap': swap,
  };
}

/**
 * WebSocket helpers
 */
export function hxWs(connectUrl: string): Record<string, any> {
  return {
    'hx-ext': 'ws',
    'ws-connect': connectUrl,
  };
}

/**
 * Response headers for htmx
 */
export const HX_HEADERS = {
  TRIGGER: 'HX-Trigger',
  TRIGGER_AFTER_SETTLE: 'HX-Trigger-After-Settle',
  TRIGGER_AFTER_SWAP: 'HX-Trigger-After-Swap',
  PUSH_URL: 'HX-Push-Url',
  REDIRECT: 'HX-Redirect',
  REFRESH: 'HX-Refresh',
  REPLACE_URL: 'HX-Replace-Url',
  RESWAP: 'HX-Reswap',
  RETARGET: 'HX-Retarget',
} as const;

/**
 * Helper to set htmx response headers
 */
export class HxResponse {
  private headers: Record<string, string> = {};

  trigger(event: string | Record<string, any>): this {
    this.headers[HX_HEADERS.TRIGGER] =
      typeof event === 'string' ? event : JSON.stringify(event);
    return this;
  }

  triggerAfterSettle(event: string | Record<string, any>): this {
    this.headers[HX_HEADERS.TRIGGER_AFTER_SETTLE] =
      typeof event === 'string' ? event : JSON.stringify(event);
    return this;
  }

  triggerAfterSwap(event: string | Record<string, any>): this {
    this.headers[HX_HEADERS.TRIGGER_AFTER_SWAP] =
      typeof event === 'string' ? event : JSON.stringify(event);
    return this;
  }

  pushUrl(url: string): this {
    this.headers[HX_HEADERS.PUSH_URL] = url;
    return this;
  }

  redirect(url: string): this {
    this.headers[HX_HEADERS.REDIRECT] = url;
    return this;
  }

  refresh(): this {
    this.headers[HX_HEADERS.REFRESH] = 'true';
    return this;
  }

  replaceUrl(url: string): this {
    this.headers[HX_HEADERS.REPLACE_URL] = url;
    return this;
  }

  reswap(swap: HxSwap): this {
    this.headers[HX_HEADERS.RESWAP] = swap;
    return this;
  }

  retarget(selector: string): this {
    this.headers[HX_HEADERS.RETARGET] = selector;
    return this;
  }

  build(): Record<string, string> {
    return { ...this.headers };
  }
}

export function hxResponse(): HxResponse {
  return new HxResponse();
}
