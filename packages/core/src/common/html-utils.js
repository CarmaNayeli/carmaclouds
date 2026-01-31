/**
 * HTML Utilities
 * Functions for safe HTML handling and XSS prevention
 * Configurable for different projects (owlcloud, rollcloud, etc.)
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for innerHTML
 */
function escapeHTML(str) {
  if (!str) return '';
  if (typeof str !== 'string') str = String(str);

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Validate postMessage event origin
 * @param {MessageEvent} event - The message event
 * @param {string[]} allowedOrigins - Array of allowed origins (can include * wildcards)
 * @returns {boolean} True if origin is allowed
 */
function validateMessageOrigin(event, allowedOrigins) {
  if (!event || !event.origin) {
    debug.warn('❌ Invalid message event or missing origin');
    return false;
  }

  const origin = event.origin;

  for (const allowed of allowedOrigins) {
    // Handle wildcard subdomains (e.g., "https://*.dicecloud.com")
    if (allowed.includes('*')) {
      // Convert wildcard to regex pattern
      const pattern = allowed
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '[^.]+'); // * matches subdomain
      const regex = new RegExp('^' + pattern + '$');

      if (regex.test(origin)) {
        debug.log('✅ Message origin validated:', origin);
        return true;
      }
    } else {
      // Exact match
      if (origin === allowed) {
        debug.log('✅ Message origin validated:', origin);
        return true;
      }
    }
  }

  debug.warn('❌ Rejected message from untrusted origin:', origin);
  return false;
}

/**
 * Create configured HTML utilities for a specific project
 * @param {Object} config - Configuration object
 * @param {string[]} config.allowedOrigins - Array of allowed origins for postMessage
 * @param {string} config.defaultOrigin - Default origin for postMessage
 * @returns {Object} Configured HTML utilities
 */
function createHTMLUtils(config = {}) {
  const allowedOrigins = config.allowedOrigins || [
    'https://dicecloud.com',
    'https://*.dicecloud.com'
  ];
  const defaultOrigin = config.defaultOrigin || 'https://dicecloud.com';

  return {
    escapeHTML,
    validateMessageOrigin,
    allowedOrigins,

    /**
     * Safe wrapper for postMessage with explicit origin
     * @param {Window} target - Target window
     * @param {*} message - Message to send
     * @param {string} origin - Target origin (defaults to configured default)
     */
    safePostMessage(target, message, origin = defaultOrigin) {
      if (!target || target.closed) {
        debug.warn('⚠️ Target window is closed or invalid');
        return false;
      }

      try {
        target.postMessage(message, origin);
        debug.log('📤 Message sent to:', origin);
        return true;
      } catch (error) {
        debug.error('❌ Failed to send message:', error);
        return false;
      }
    },

    /**
     * Create a safe message handler with origin validation
     * @param {Function} handler - Message handler function (receives validated event)
     * @param {string[]} customAllowedOrigins - Optional custom allowed origins
     * @returns {Function} Wrapped handler with validation
     */
    createSafeMessageHandler(handler, customAllowedOrigins = null) {
      const origins = customAllowedOrigins || allowedOrigins;
      return function(event) {
        if (!validateMessageOrigin(event, origins)) {
          return; // Reject invalid origins
        }

        // Call original handler with validated event
        handler(event);
      };
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHTML,
    validateMessageOrigin,
    createHTMLUtils
  };
}

// Make factory available globally
if (typeof window !== 'undefined') {
  window.createHTMLUtils = createHTMLUtils;
}
