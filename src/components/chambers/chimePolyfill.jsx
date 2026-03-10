// Polyfill required by amazon-chime-sdk-js which expects Node.js globals in browser
if (typeof global === 'undefined') {
  window.global = window;
}
if (typeof process === 'undefined') {
  window.process = { env: {}, browser: true };
}