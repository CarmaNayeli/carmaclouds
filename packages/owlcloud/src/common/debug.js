// Simple debug logger wrapper
const debug = {
  log: (...args) => console.log('[OwlCloud]', ...args),
  warn: (...args) => console.warn('[OwlCloud]', ...args),
  error: (...args) => console.error('[OwlCloud]', ...args),
  info: (...args) => console.info('[OwlCloud]', ...args)
};

// For background script (no module system)
if (typeof window !== 'undefined') {
  window.debug = debug;
} else if (typeof self !== 'undefined') {
  self.debug = debug;
} else if (typeof global !== 'undefined') {
  global.debug = debug;
}

// For modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debug;
}

// For ES6 modules
if (typeof exports !== 'undefined') {
  exports.debug = debug;
}
