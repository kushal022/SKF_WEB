const { Model } = require('objection');
const knex = require('./knex');

// Bind Objection.js Model to the Knex database instance
Model.knex(knex);

module.exports = {
  knex,
  Model,
};
