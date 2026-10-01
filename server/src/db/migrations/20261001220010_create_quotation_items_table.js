/**
 * Migration: create_quotation_items_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('quotation_items', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Parent quotation reference
    table.bigInteger('quotation_id').unsigned().notNullable();

    // Optional product reference (nullable for custom fabrication, transport, installation, etc.)
    table.bigInteger('product_id').unsigned().nullable();

    // Item line description
    table.string('description', 500).notNullable();

    // Quantity (DECIMAL(10,2) to accommodate pieces, running feet, sq ft, etc.)
    table.decimal('quantity', 10, 2).notNullable().defaultTo(1);

    // Pricing details (DECIMAL(12,2))
    table.decimal('unit_price', 12, 2).notNullable().defaultTo(0);
    table.decimal('customization_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('line_total', 12, 2).notNullable().defaultTo(0);

    // Structured metadata for dimensions, material grade, finish, color, fabrication specs
    table.json('metadata').nullable();

    // Timestamp
    table.dateTime('created_at').notNullable();

    // Foreign key constraints
    table
      .foreign('quotation_id', 'fk_quotation_items_quotation_id')
      .references('id')
      .inTable('quotations')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('product_id', 'fk_quotation_items_product_id')
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['quotation_id'], 'idx_quotation_items_quotation_id');
    table.index(['product_id'], 'idx_quotation_items_product_id');
    table.index(['created_at'], 'idx_quotation_items_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('quotation_items');
};
