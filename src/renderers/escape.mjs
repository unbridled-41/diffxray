/**
 * @fileoverview Strict HTML, XML/SVG, and JSON-in-script escaping utilities.
 */

const HTML_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape untrusted string for safe HTML or SVG text/attribute interpolation.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_MAP[ch]);
}

/**
 * Serialize data safely for embedding inside an HTML `<script>` block without XSS.
 * @param {unknown} data
 * @returns {string}
 */
export function safeJsonForScript(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
