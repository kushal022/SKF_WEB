const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`Knex configuration for environment "${environment}" not found in knexfile.js`);
}

const db = knex(config);

module.exports = db;
