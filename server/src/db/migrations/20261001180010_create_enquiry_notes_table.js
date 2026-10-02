/**
 * Migration: create_enquiry_notes_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('enquiry_notes', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Relationships
    table.bigInteger('enquiry_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().nullable();

    // Note content
    table.text('note').notNullable();

    // Timestamps
    table.dateTime('created_at').notNullable();

    // Foreign key constraints
    table
      .foreign('enquiry_id', 'fk_enquiry_notes_enquiry_id')
      .references('id')
      .inTable('enquiries')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('user_id', 'fk_enquiry_notes_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['enquiry_id'], 'idx_enquiry_notes_enquiry_id');
    table.index(['user_id'], 'idx_enquiry_notes_user_id');
    table.index(['created_at'], 'idx_enquiry_notes_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('enquiry_notes');
};
