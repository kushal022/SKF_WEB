/**
 * Migration: create_enquiries_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('enquiries', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Customer details
    table.string('customer_name', 150).notNullable();
    table.string('phone', 20).notNullable();
    table.string('email', 255).nullable();

    // Optional references
    table.bigInteger('product_id').unsigned().nullable();
    table.bigInteger('custom_request_id').unsigned().nullable();

    // Enquiry metadata
    table.string('source', 50).nullable();
    table.text('message').nullable();

    // Status lifecycle (VARCHAR for application-level state machine)
    table.string('status', 30).notNullable().defaultTo('new');

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (Product deletion unlinks enquiry rather than deleting customer lead)
    table
      .foreign('product_id', 'fk_enquiries_product_id')
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['product_id'], 'idx_enquiries_product_id');
    table.index(['custom_request_id'], 'idx_enquiries_custom_request_id');
    table.index(['status'], 'idx_enquiries_status');
    table.index(['source'], 'idx_enquiries_source');
    table.index(['phone'], 'idx_enquiries_phone');
    table.index(['created_at'], 'idx_enquiries_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('enquiries');
};
