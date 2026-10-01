const { env, validateEnv } = require('./env');

module.exports = {
  ...env,
  validateEnv,
  // Alias for backward compatibility
  env: env.nodeEnv,
};
