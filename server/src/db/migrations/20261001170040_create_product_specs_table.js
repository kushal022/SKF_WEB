/**
 * Migration: create_product_specs_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_specs', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Product reference
    table.bigInteger('product_id').unsigned().notNullable();

    // Spec details (spec_name is NOT globally unique)
    table.string('spec_name', 150).notNullable();
    table.string('spec_value', 500).notNullable();

    // Ordering
    table.integer('sort_order').notNullable().defaultTo(0);

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (CASCADE deletion when product is removed)
    table
      .foreign('product_id', 'fk_product_specs_product_id')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['product_id'], 'idx_product_specs_product_id');
    table.index(['sort_order'], 'idx_product_specs_sort_order');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_specs');
};
