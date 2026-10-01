/**
 * Migration: add_custom_request_fk_to_enquiries
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('enquiries', (table) => {
    table
      .foreign('custom_request_id', 'fk_enquiries_custom_request_id')
      .references('id')
      .inTable('custom_requests')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('enquiries', (table) => {
    table.dropForeign('custom_request_id', 'fk_enquiries_custom_request_id');
  });
};
