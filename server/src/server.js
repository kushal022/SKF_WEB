/**
 * Legacy Server Entry Point
 * Delegates to src/index.js for clean modular server initialization.
 */
const { startServer } = require('./index');

if (require.main === module) {
  startServer();
}

module.exports = require('./index');
