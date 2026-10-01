/**
 * Migration: create_order_items_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Parent order reference
    table.bigInteger('order_id').unsigned().notNullable();

    // Optional product reference (nullable for custom furniture, fabrication, etc.)
    table.bigInteger('product_id').unsigned().nullable();

    // Line description
    table.string('description', 500).notNullable();

    // Quantity and pricing
    table.decimal('quantity', 10, 2).notNullable().defaultTo(1);
    table.decimal('unit_price', 12, 2).notNullable().defaultTo(0);
    table.decimal('line_total', 12, 2).notNullable().defaultTo(0);

    // Structured metadata
    table.json('metadata').nullable();

    // Timestamp
    table.dateTime('created_at').notNullable();

    // Foreign key constraints
    table
      .foreign('order_id', 'fk_order_items_order_id')
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('product_id', 'fk_order_items_product_id')
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['order_id'], 'idx_order_items_order_id');
    table.index(['product_id'], 'idx_order_items_product_id');
    table.index(['created_at'], 'idx_order_items_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items');
};
