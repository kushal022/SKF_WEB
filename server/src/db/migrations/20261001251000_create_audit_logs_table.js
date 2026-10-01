/**
 * Migration: create_audit_logs_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // User reference (SET NULL when user is deleted to preserve immutable audit trail)
    table.bigInteger('user_id').unsigned().nullable();

    // Action identifier
    table.string('action', 100).notNullable();

    // Polymorphic entity reference (no FK)
    table.string('entity_type', 50).nullable();
    table.bigInteger('entity_id').unsigned().nullable();

    // State diffs and context
    table.json('old_values').nullable();
    table.json('new_values').nullable();
    table.json('metadata').nullable();

    // Request metadata
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();

    // Immutable timestamp (no updated_at)
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    // Foreign key constraint (SET NULL on delete)
    table
      .foreign('user_id', 'fk_audit_logs_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['user_id'], 'idx_audit_logs_user_id');
    table.index(['action'], 'idx_audit_logs_action');
    table.index(['entity_type', 'entity_id'], 'idx_audit_logs_entity');
    table.index(['created_at'], 'idx_audit_logs_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
