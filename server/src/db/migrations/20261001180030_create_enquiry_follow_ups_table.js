/**
 * Migration: create_enquiry_follow_ups_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('enquiry_follow_ups', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Relationships
    table.bigInteger('enquiry_id').unsigned().notNullable();
    table.bigInteger('assigned_to').unsigned().nullable();

    // Scheduling and details
    table.dateTime('follow_up_at').notNullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.text('note').nullable();
    table.dateTime('completed_at').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraints
    table
      .foreign('enquiry_id', 'fk_enquiry_follow_ups_enquiry_id')
      .references('id')
      .inTable('enquiries')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('assigned_to', 'fk_enquiry_follow_ups_assigned_to')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['enquiry_id'], 'idx_enquiry_follow_ups_enquiry_id');
    table.index(['assigned_to'], 'idx_enquiry_follow_ups_assigned_to');
    table.index(['follow_up_at'], 'idx_enquiry_follow_ups_follow_up_at');
    table.index(['status'], 'idx_enquiry_follow_ups_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('enquiry_follow_ups');
};
