/**
 * Migration: create_b2b_documents_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('b2b_documents', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Account reference
    table.bigInteger('b2b_account_id').unsigned().notNullable();

    // Document metadata
    table.string('document_type', 50).notNullable();
    table.string('document_url', 500).notNullable();
    table.string('cloudinary_public_id', 255).nullable();

    // Verification workflow
    table.string('verification_status', 30).notNullable().defaultTo('pending');
    table.text('rejection_reason').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (CASCADE deletion when B2B account is deleted)
    table
      .foreign('b2b_account_id', 'fk_b2b_documents_account_id')
      .references('id')
      .inTable('b2b_accounts')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['b2b_account_id'], 'idx_b2b_documents_account_id');
    table.index(['document_type'], 'idx_b2b_documents_document_type');
    table.index(['verification_status'], 'idx_b2b_documents_verification_status');
    table.index(['created_at'], 'idx_b2b_documents_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2b_documents');
};
