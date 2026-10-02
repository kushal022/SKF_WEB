/**
 * Migration: create_galleries_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('galleries', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Gallery details
    table.string('title', 200).notNullable();
    table.string('slug', 220).notNullable().unique();
    table.string('category', 100).nullable();
    table.text('description').nullable();

    // Lifecycle status (VARCHAR for application-level state machine)
    table.string('status', 30).notNullable().defaultTo('draft');

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Indexes
    table.index(['category'], 'idx_galleries_category');
    table.index(['status'], 'idx_galleries_status');
    table.index(['created_at'], 'idx_galleries_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('galleries');
};
