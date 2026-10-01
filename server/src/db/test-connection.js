const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { knex } = require('./index');

/**
 * Tests database connectivity using a lightweight query.
 * Logs "Database connected successfully" or "Database connection failed".
 *
 * @param {boolean} exitProcess - Whether to exit process after test (used for CLI test)
 * @returns {Promise<boolean>}
 */
async function testConnection(exitProcess = false) {
  try {
    await knex.raw('SELECT 1+1 AS result');
    console.log('Database connected successfully');
    if (exitProcess) {
      await knex.destroy();
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Database connection failed');
    console.error(`Details: ${error.message}`);
    if (exitProcess) {
      await knex.destroy().catch(() => {});
      process.exit(1);
    }
    return false;
  }
}

if (require.main === module) {
  testConnection(true);
}

module.exports = {
  testConnection,
};
