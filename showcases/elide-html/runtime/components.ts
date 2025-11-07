/**
 * ElideHTML - Component System
 *
 * Reusable UI components with props and slots.
 * Zero overhead, pure function components.
 */

import { html, HtmlNode } from './renderer.ts';
import { hx, htmx } from '../helpers/htmx-helpers.ts';

export interface ComponentProps {
  [key: string]: any;
}

export type Component<T = ComponentProps> = (props: T) => HtmlNode;

/**
 * Layout components
 */
export const Layout = {
  /**
   * Full HTML document wrapper
   */
  Document: (props: {
    title: string;
    head?: HtmlNode[];
    children: HtmlNode[];
    htmx?: boolean;
    htmxVersion?: string;
  }): HtmlNode => {
    const htmxVersion = props.htmxVersion || '1.9.10';

    return html.html(
      { lang: 'en' },
      html.head(
        null,
        html.meta({ charset: 'utf-8' }),
        html.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
        html.title(props.title),
        props.htmx
          ? html.script({
              src: `https://unpkg.com/htmx.org@${htmxVersion}`,
              crossorigin: 'anonymous',
            })
          : null,
        ...(props.head || [])
      ),
      html.body(null, ...props.children)
    );
  },

  /**
   * Container with max-width
   */
  Container: (props: { class?: string; children: HtmlNode[] }): HtmlNode => {
    return html.div(
      {
        class: `container mx-auto px-4 ${props.class || ''}`,
      },
      ...props.children
    );
  },

  /**
   * Grid layout
   */
  Grid: (props: { cols?: number; gap?: number; children: HtmlNode[] }): HtmlNode => {
    return html.div(
      {
        style: `display: grid; grid-template-columns: repeat(${props.cols || 3}, 1fr); gap: ${props.gap || 1}rem;`,
      },
      ...props.children
    );
  },

  /**
   * Stack layout (vertical)
   */
  Stack: (props: { gap?: number; children: HtmlNode[] }): HtmlNode => {
    return html.div(
      {
        style: `display: flex; flex-direction: column; gap: ${props.gap || 1}rem;`,
      },
      ...props.children
    );
  },
};

/**
 * UI components
 */
export const UI = {
  /**
   * Button component
   */
  Button: (props: {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger';
    children: (HtmlNode | string)[];
    [key: string]: any;
  }): HtmlNode => {
    const { type, variant, children, ...attrs } = props;
    const variantClass = variant || 'primary';

    return html.button(
      {
        type: type || 'button',
        class: `btn btn-${variantClass}`,
        ...attrs,
      },
      ...children
    );
  },

  /**
   * Card component
   */
  Card: (props: {
    title?: string;
    header?: HtmlNode;
    footer?: HtmlNode;
    children: HtmlNode[];
    class?: string;
  }): HtmlNode => {
    return html.div(
      { class: `card ${props.class || ''}` },
      props.title || props.header
        ? html.div({ class: 'card-header' }, props.header || html.h3(null, props.title!))
        : null,
      html.div({ class: 'card-body' }, ...props.children),
      props.footer ? html.div({ class: 'card-footer' }, props.footer) : null
    );
  },

  /**
   * Alert component
   */
  Alert: (props: {
    type: 'success' | 'error' | 'warning' | 'info';
    dismissible?: boolean;
    children: (HtmlNode | string)[];
  }): HtmlNode => {
    const attrs: any = { class: `alert alert-${props.type}`, role: 'alert' };

    if (props.dismissible) {
      attrs.id = 'alert-' + Math.random().toString(36).substr(2, 9);
    }

    return html.div(
      attrs,
      ...props.children,
      props.dismissible
        ? html.button(
            {
              ...hx().delete(`#${attrs.id}`).swap('outerHTML').build(),
              class: 'alert-close',
            },
            '×'
          )
        : null
    );
  },

  /**
   * Loading spinner
   */
  Spinner: (props: { size?: 'sm' | 'md' | 'lg'; class?: string }): HtmlNode => {
    return html.div({
      class: `spinner spinner-${props.size || 'md'} ${props.class || ''}`,
      role: 'status',
      'aria-label': 'Loading',
    });
  },

  /**
   * Badge component
   */
  Badge: (props: {
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    children: (HtmlNode | string)[];
  }): HtmlNode => {
    return html.span(
      { class: `badge badge-${props.variant || 'primary'}` },
      ...props.children
    );
  },

  /**
   * Progress bar
   */
  Progress: (props: { value: number; max?: number; class?: string }): HtmlNode => {
    const max = props.max || 100;
    const percent = (props.value / max) * 100;

    return html.div(
      { class: `progress ${props.class || ''}` },
      html.div({
        class: 'progress-bar',
        role: 'progressbar',
        style: `width: ${percent}%`,
        'aria-valuenow': props.value,
        'aria-valuemin': 0,
        'aria-valuemax': max,
      })
    );
  },
};

/**
 * Form components
 */
export const Form = {
  /**
   * Form group (label + input)
   */
  Group: (props: {
    label: string;
    name: string;
    type?: string;
    value?: string;
    required?: boolean;
    error?: string;
    help?: string;
  }): HtmlNode => {
    return html.div(
      { class: 'form-group' },
      html.label({ for: props.name }, props.label),
      html.input({
        type: props.type || 'text',
        name: props.name,
        id: props.name,
        value: props.value,
        required: props.required,
        class: props.error ? 'form-control is-invalid' : 'form-control',
      }),
      props.error ? html.div({ class: 'invalid-feedback' }, props.error) : null,
      props.help ? html.div({ class: 'form-text' }, props.help) : null
    );
  },

  /**
   * Textarea group
   */
  TextareaGroup: (props: {
    label: string;
    name: string;
    value?: string;
    rows?: number;
    required?: boolean;
    error?: string;
  }): HtmlNode => {
    return html.div(
      { class: 'form-group' },
      html.label({ for: props.name }, props.label),
      html.textarea(
        {
          name: props.name,
          id: props.name,
          rows: props.rows || 3,
          required: props.required,
          class: props.error ? 'form-control is-invalid' : 'form-control',
        },
        props.value
      ),
      props.error ? html.div({ class: 'invalid-feedback' }, props.error) : null
    );
  },

  /**
   * Select group
   */
  SelectGroup: (props: {
    label: string;
    name: string;
    options: { value: string; label: string }[];
    value?: string;
    required?: boolean;
    error?: string;
  }): HtmlNode => {
    return html.div(
      { class: 'form-group' },
      html.label({ for: props.name }, props.label),
      html.select(
        {
          name: props.name,
          id: props.name,
          required: props.required,
          class: props.error ? 'form-control is-invalid' : 'form-control',
        },
        ...props.options.map((opt) =>
          html.option(
            {
              value: opt.value,
              selected: opt.value === props.value,
            },
            opt.label
          )
        )
      ),
      props.error ? html.div({ class: 'invalid-feedback' }, props.error) : null
    );
  },

  /**
   * Checkbox
   */
  Checkbox: (props: {
    label: string;
    name: string;
    checked?: boolean;
    value?: string;
  }): HtmlNode => {
    return html.div(
      { class: 'form-check' },
      html.input({
        type: 'checkbox',
        name: props.name,
        id: props.name,
        value: props.value || 'on',
        checked: props.checked,
        class: 'form-check-input',
      }),
      html.label({ for: props.name, class: 'form-check-label' }, props.label)
    );
  },
};

/**
 * HTMX-specific components
 */
export const Htmx = {
  /**
   * Infinite scroll container
   */
  InfiniteScroll: (props: {
    loadMoreUrl: string;
    children: HtmlNode[];
    threshold?: number;
  }): HtmlNode => {
    return html.div(
      null,
      ...props.children,
      html.div({
        ...htmx.infiniteScroll(props.loadMoreUrl, props.threshold),
        style: 'height: 1px;',
      })
    );
  },

  /**
   * Live search input
   */
  LiveSearch: (props: {
    searchUrl: string;
    placeholder?: string;
    resultsId?: string;
    delay?: string;
  }): HtmlNode => {
    const resultsId = props.resultsId || 'search-results';

    return html.div(
      null,
      html.input({
        type: 'search',
        name: 'q',
        placeholder: props.placeholder || 'Search...',
        ...htmx.liveSearch(props.searchUrl, props.delay),
        ...hx().target(`#${resultsId}`).build(),
        class: 'form-control',
      }),
      html.div({ id: resultsId })
    );
  },

  /**
   * Delete button with confirmation
   */
  DeleteButton: (props: {
    deleteUrl: string;
    confirmMessage?: string;
    children?: (HtmlNode | string)[];
  }): HtmlNode => {
    return html.button(
      {
        type: 'button',
        ...htmx.deleteWithConfirm(
          props.deleteUrl,
          props.confirmMessage || 'Are you sure?'
        ),
        class: 'btn btn-danger',
      },
      ...(props.children || ['Delete'])
    );
  },

  /**
   * Auto-refresh container
   */
  AutoRefresh: (props: {
    refreshUrl: string;
    interval: string;
    children: HtmlNode[];
  }): HtmlNode => {
    return html.div(
      { ...htmx.autoRefresh(props.refreshUrl, props.interval) },
      ...props.children
    );
  },

  /**
   * Lazy load placeholder
   */
  LazyLoad: (props: { loadUrl: string; placeholder?: HtmlNode }): HtmlNode => {
    return html.div(
      { ...htmx.lazyLoad(props.loadUrl) },
      props.placeholder || UI.Spinner({ size: 'md' })
    );
  },

  /**
   * Modal/Dialog trigger
   */
  ModalTrigger: (props: {
    modalUrl: string;
    targetId?: string;
    children: (HtmlNode | string)[];
  }): HtmlNode => {
    return html.button(
      {
        type: 'button',
        ...htmx.modal(props.modalUrl, props.targetId),
        class: 'btn',
      },
      ...props.children
    );
  },
};

/**
 * Table components
 */
export const Table = {
  /**
   * Data table with sorting
   */
  DataTable: <T extends Record<string, any>>(props: {
    columns: { key: string; label: string; sortable?: boolean }[];
    data: T[];
    sortUrl?: string;
    rowKey?: (row: T) => string;
  }): HtmlNode => {
    return html.table(
      { class: 'table' },
      html.thead(
        null,
        html.tr(
          null,
          ...props.columns.map((col) =>
            html.th(
              null,
              col.sortable && props.sortUrl
                ? html.a(
                    {
                      href: '#',
                      ...hx().get(`${props.sortUrl}?sort=${col.key}`).build(),
                    },
                    col.label
                  )
                : col.label
            )
          )
        )
      ),
      html.tbody(
        null,
        ...props.data.map((row) =>
          html.tr(
            props.rowKey ? { id: props.rowKey(row) } : null,
            ...props.columns.map((col) => html.td(null, String(row[col.key] || '')))
          )
        )
      )
    );
  },
};

/**
 * List components
 */
export const List = {
  /**
   * Simple list
   */
  List: (props: {
    items: (HtmlNode | string)[];
    ordered?: boolean;
    class?: string;
  }): HtmlNode => {
    const Tag = props.ordered ? html.ol : html.ul;
    return Tag({ class: props.class }, ...props.items.map((item) => html.li(null, item)));
  },

  /**
   * Description list
   */
  DescriptionList: (props: {
    items: { term: string; description: string }[];
    class?: string;
  }): HtmlNode => {
    return html.html(
      { tag: 'dl', class: props.class },
      ...props.items.flatMap((item) => [
        html.html({ tag: 'dt' }, item.term),
        html.html({ tag: 'dd' }, item.description),
      ])
    ) as any;
  },
};
