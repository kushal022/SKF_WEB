/**
 * Migration: create_custom_requests_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('custom_requests', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Furniture specification
    table.string('product_type', 150).notNullable();
    table.decimal('width', 10, 2).nullable();
    table.decimal('length', 10, 2).nullable();
    table.decimal('height', 10, 2).nullable();
    table.string('dimension_unit', 20).nullable();

    table.string('material', 150).nullable();
    table.string('finish', 150).nullable();
    table.integer('quantity').unsigned().notNullable().defaultTo(1);

    // Customer details
    table.string('customer_name', 150).notNullable();
    table.string('phone', 20).notNullable();
    table.string('email', 255).nullable();
    table.string('city', 100).nullable();
    table.text('requirement').nullable();

    // Price estimate & status lifecycle
    table.decimal('estimated_amount', 12, 2).nullable();
    table.string('status', 30).notNullable().defaultTo('new');

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Indexes
    table.index(['product_type'], 'idx_custom_requests_product_type');
    table.index(['phone'], 'idx_custom_requests_phone');
    table.index(['status'], 'idx_custom_requests_status');
    table.index(['city'], 'idx_custom_requests_city');
    table.index(['created_at'], 'idx_custom_requests_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('custom_requests');
};
