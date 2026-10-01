const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection } = require('./db/test-connection');

const PORT = process.env.PORT || 7000;

async function startServer() {
  // Test database connection at startup
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
