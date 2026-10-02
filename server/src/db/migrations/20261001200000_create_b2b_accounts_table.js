/**
 * Migration: create_b2b_accounts_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('b2b_accounts', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Business identity
    table.string('company_name', 200).notNullable();
    table.string('contact_name', 150).notNullable();
    table.string('email', 255).nullable();
    table.string('phone', 20).notNullable();
    table.string('business_type', 100).nullable();

    // Tax & Physical details (GST is NOT globally unique)
    table.string('gst_number', 30).nullable();
    table.text('address').nullable();

    // Verification & Tiering
    table.string('verification_status', 30).notNullable().defaultTo('pending');
    table.string('discount_tier', 50).nullable();
    table.text('notes').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Indexes
    table.index(['phone'], 'idx_b2b_accounts_phone');
    table.index(['email'], 'idx_b2b_accounts_email');
    table.index(['gst_number'], 'idx_b2b_accounts_gst_number');
    table.index(['business_type'], 'idx_b2b_accounts_business_type');
    table.index(['verification_status'], 'idx_b2b_accounts_verification_status');
    table.index(['discount_tier'], 'idx_b2b_accounts_discount_tier');
    table.index(['created_at'], 'idx_b2b_accounts_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2b_accounts');
};
