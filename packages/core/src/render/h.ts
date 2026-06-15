/**
 * Tiny DOM builder - the rebuild's render primitive. Replaces innerHTML template
 * strings with safe DOM construction: text and attribute values go through
 * textContent / setAttribute, so interpolated character data (now arbitrary,
 * user-named attributes from any system) can never be parsed as HTML.
 *
 *   h('div', { class: 'box', onClick: () => roll() },
 *     h('span', { class: 'label', text: name }),  // text -> textContent (safe)
 *     score)                                       // primitives -> text node
 */

export type HChild = Node | string | number | null | undefined | boolean | HChild[];

export interface HProps {
  /** textContent - use for any dynamic / character data. */
  text?: string | number;
  /** className. */
  class?: string;
  /** Inline style as a string (cssText) or a property map. */
  style?: string | Partial<Record<string, string>>;
  /** data-* attributes. */
  dataset?: Record<string, string>;
  /** onClick / onInput / onChange / ... -> addEventListener. */
  [key: string]: unknown;
}

function append(el: Node, child: HChild): void {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    for (const c of child) append(el, c);
  } else if (child instanceof Node) {
    el.appendChild(child);
  } else {
    el.appendChild(document.createTextNode(String(child)));
  }
}

export function h(tag: string, props?: HProps | null, ...children: HChild[]): HTMLElement {
  const el = document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;

      if (key === 'text') {
        el.textContent = String(value);
      } else if (key === 'class') {
        el.className = value as string;
      } else if (key === 'style') {
        if (typeof value === 'string') el.style.cssText = value;
        else Object.assign(el.style, value);
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value as Record<string, string>);
      } else if (
        key.length > 2 && key[0] === 'o' && key[1] === 'n' &&
        key[2] === key[2].toUpperCase() && typeof value === 'function'
      ) {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  append(el, children);
  return el;
}

/** Replace all children of `el` with the given nodes/values. */
export function setChildren(el: Element, ...children: HChild[]): Element {
  el.replaceChildren();
  append(el, children);
  return el;
}
