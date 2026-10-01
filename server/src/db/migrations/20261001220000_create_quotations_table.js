/**
 * Migration: create_quotations_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('quotations', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Unique quotation number identifier (e.g. SKF-QT-2026-000001)
    table.string('quotation_number', 50).notNullable().unique();

    // Optional relationships
    table.bigInteger('enquiry_id').unsigned().nullable();
    table.bigInteger('b2b_account_id').unsigned().nullable();

    // Customer snapshot (immutable audit snapshot of customer contact details)
    table.string('customer_name', 150).notNullable();
    table.string('customer_phone', 20).notNullable();
    table.string('customer_email', 255).nullable();

    // Financial breakdown (DECIMAL(12,2) for precise money calculation)
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    table.decimal('customization_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('transport_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('installation_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);

    // Validity
    table.date('valid_until').nullable();

    // Quotation state
    table.string('status', 30).notNullable().defaultTo('draft');

    // Notes
    table.text('notes').nullable();

    // Admin/User who created this quotation
    table.bigInteger('created_by').unsigned().nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraints
    table
      .foreign('enquiry_id', 'fk_quotations_enquiry_id')
      .references('id')
      .inTable('enquiries')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table
      .foreign('b2b_account_id', 'fk_quotations_b2b_account_id')
      .references('id')
      .inTable('b2b_accounts')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table
      .foreign('created_by', 'fk_quotations_created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['enquiry_id'], 'idx_quotations_enquiry_id');
    table.index(['b2b_account_id'], 'idx_quotations_b2b_account_id');
    table.index(['quotation_number'], 'idx_quotations_quotation_number');
    table.index(['status'], 'idx_quotations_status');
    table.index(['valid_until'], 'idx_quotations_valid_until');
    table.index(['created_by'], 'idx_quotations_created_by');
    table.index(['created_at'], 'idx_quotations_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('quotations');
};
