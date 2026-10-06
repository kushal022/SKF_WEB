const http = require('http');
const config = require('./config');
const app = require('./app');
const { knex } = require('./db');
const { testConnection } = require('./db/test-connection');
const { initSocketServer, closeSocketServer, getIo } = require('./socket');

let server = null;
let isShuttingDown = false;

/**
 * Graceful Shutdown Handler
 *
 * @param {string} signal - Signal received (e.g., 'SIGTERM', 'SIGINT')
 * @param {boolean} [exitProcess=true] - Whether to call process.exit()
 */
const gracefulShutdown = async (signal, exitProcess = true) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  // Force process exit if graceful shutdown hangs
  let forceExitTimeout = null;
  if (exitProcess) {
    forceExitTimeout = setTimeout(() => {
      console.error('[Server] Graceful shutdown timed out (10s). Forcefully exiting.');
      process.exit(1);
    }, 10000);
    forceExitTimeout.unref();
  }

  // 1. Close Socket.IO connections
  try {
    closeSocketServer();
    console.log('[Socket] Socket.IO server closed.');
  } catch (err) {
    console.error('[Socket] Error closing Socket.IO:', err.message);
  }

  // 2. Stop accepting new HTTP connections and close HTTP server
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[Server] Error while closing HTTP server:', err.message);
        } else {
          console.log('[Server] HTTP server stopped accepting connections.');
        }
        resolve();
      });
    });
  }

  // 3. Destroy Knex database connection pool
  try {
    if (knex) {
      await knex.destroy();
      console.log('[Database] Database connection pool closed.');
    }
  } catch (err) {
    console.error('[Database] Error closing database connection pool:', err.message);
  }

  // 4. Exit cleanly
  console.log('[Server] Graceful shutdown completed.');
  if (exitProcess) {
    process.exit(0);
  }
};

/**
 * Start Server Routine
 */
async function startServer() {
  try {
    // 1. Validate environment configuration
    config.validateEnv();

    // 2. Test database connection
    await testConnection();

    // 3. Start HTTP server with Socket.IO integration
    const PORT = config.port;
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    server = httpServer.listen(PORT, () => {
      console.log(`[Server] SKF Furniture API running on port ${PORT} [${config.nodeEnv}]`);
      console.log(`[Server] Versioned API prefix mounted at ${config.apiPrefix}`);
      console.log('[Server] Socket.IO real-time engine attached');
    });

    // 4. Register signal listeners for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('[Server] Startup failed:', error.message);
    process.exit(1);
  }
}

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  gracefulShutdown,
  getIo,
};
