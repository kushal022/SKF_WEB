/**
 * Migration: create_enquiry_status_logs_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('enquiry_status_logs', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Relationships
    table.bigInteger('enquiry_id').unsigned().notNullable();
    table.bigInteger('changed_by').unsigned().nullable();

    // Transition details
    table.string('from_status', 30).nullable();
    table.string('to_status', 30).notNullable();
    table.text('comment').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();

    // Foreign key constraints
    table
      .foreign('enquiry_id', 'fk_enquiry_status_logs_enquiry_id')
      .references('id')
      .inTable('enquiries')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('changed_by', 'fk_enquiry_status_logs_changed_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['enquiry_id'], 'idx_enquiry_status_logs_enquiry_id');
    table.index(['changed_by'], 'idx_enquiry_status_logs_changed_by');
    table.index(['created_at'], 'idx_enquiry_status_logs_created_at');
    table.index(['to_status'], 'idx_enquiry_status_logs_to_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('enquiry_status_logs');
};
