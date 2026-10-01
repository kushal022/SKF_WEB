/**
 * Migration: create_sessions_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Foreign key pointing to users.id
    table.bigInteger('user_id').unsigned().notNullable();

    // Session token and metadata
    table.string('refresh_token_hash', 255).notNullable();
    table.string('device_info', 255).nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();

    // Expiration and Revocation
    table.dateTime('expires_at').notNullable();
    table.dateTime('revoked_at').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint
    table
      .foreign('user_id', 'fk_sessions_user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['user_id'], 'idx_sessions_user_id');
    table.index(['expires_at'], 'idx_sessions_expires_at');
    table.index(['revoked_at'], 'idx_sessions_revoked_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sessions');
};
