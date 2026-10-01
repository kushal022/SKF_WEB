const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * Knex Configuration for SKF Furniture Backend
 * Database: MySQL 8+
 * Engine: InnoDB
 * Default Charset: utf8mb4
 */
module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'skf_furniture',
      charset: 'utf8mb4',
      dateStrings: true,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_TEST_NAME || `${process.env.DB_NAME || 'skf_furniture'}_test`,
      charset: 'utf8mb4',
      dateStrings: true,
    },
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
      dateStrings: true,
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};
