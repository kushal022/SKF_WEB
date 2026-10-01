/**
 * Migration: create_orders_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('orders', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Unique order number identifier (e.g. SKF-ORD-2026-000001)
    table.string('order_number', 50).notNullable().unique();

    // Optional quotation reference
    table.bigInteger('quotation_id').unsigned().nullable();

    // Customer snapshot (immutable audit snapshot of customer contact details)
    table.string('customer_name', 150).notNullable();
    table.string('customer_phone', 20).notNullable();
    table.string('customer_email', 150).nullable();

    // Financial breakdown (DECIMAL(12,2) for exact currency calculation)
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('installation_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);

    // Order status
    table.string('status', 30).notNullable().defaultTo('pending');

    // Additional notes
    table.text('notes').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraints
    table
      .foreign('quotation_id', 'fk_orders_quotation_id')
      .references('id')
      .inTable('quotations')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['quotation_id'], 'idx_orders_quotation_id');
    table.index(['status'], 'idx_orders_status');
    table.index(['created_at'], 'idx_orders_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orders');
};
