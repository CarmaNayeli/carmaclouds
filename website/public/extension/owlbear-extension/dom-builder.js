/**
 * Tiny DOM builder - replaces innerHTML template strings with safe DOM construction.
 *
 * Loaded as a classic script (before popover.js / chat.js) and exposed as window.h.
 * Text and attribute values go through textContent / setAttribute, so interpolated
 * character data can never be parsed as HTML (no XSS, no innerHTML lint warnings).
 *
 *   h('div', { class: 'box', title: 'hi', onClick: () => roll() },
 *     h('span', { class: 'label', text: name }),   // text -> textContent (safe)
 *     score)                                        // primitives -> text node
 *
 * Props:
 *   text:    sets textContent (use for any dynamic/character data)
 *   class:   sets className
 *   style:   string -> el.style.cssText; object -> Object.assign(el.style, ...)
 *   dataset: object -> Object.assign(el.dataset, ...)
 *   onX:     function -> addEventListener('x', fn)  (onClick, onSubmit, onInput, ...)
 *   other:   setAttribute(key, value)  (title, id, href, placeholder, aria-*, ...)
 *   null / undefined / false values are skipped.
 *
 * Children: nodes are appended; strings/numbers become text nodes; arrays are
 * flattened; null / undefined / false are skipped (so `cond && h(...)` works).
 */
(function () {
  function append(el, child) {
    if (child == null || child === false || child === true) return;
    if (Array.isArray(child)) {
      for (const c of child) append(el, c);
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }

  function h(tag, props, ...children) {
    const el = document.createElement(tag);

    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;

        if (key === 'text') {
          el.textContent = value;
        } else if (key === 'class' || key === 'className') {
          el.className = value;
        } else if (key === 'style') {
          if (typeof value === 'string') el.style.cssText = value;
          else Object.assign(el.style, value);
        } else if (key === 'dataset') {
          Object.assign(el.dataset, value);
        } else if (key.length > 2 && key[0] === 'o' && key[1] === 'n'
                   && key[2] === key[2].toUpperCase() && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          el.setAttribute(key, value);
        }
      }
    }

    append(el, children);
    return el;
  }

  /** Replace all children of `el` with the given nodes/values (innerHTML = '' + build). */
  function setChildren(el, ...children) {
    el.replaceChildren();
    append(el, children);
    return el;
  }

  if (typeof window !== 'undefined') {
    window.h = h;
    window.setChildren = setChildren;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { h, setChildren };
  }
})();
