/**
 * Migration: create_users_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // User details
    table.string('name', 150).notNullable();
    table.string('email', 255).nullable().unique();
    table.string('phone', 20).nullable();
    table.string('password_hash', 255).notNullable();

    // Role & Status (VARCHAR for flexible extension, avoiding rigid ENUMs)
    table.string('role', 30).notNullable().defaultTo('admin');
    table.string('status', 30).notNullable().defaultTo('active');

    // Timestamps
    table.dateTime('last_login_at').nullable();
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();
    table.dateTime('deleted_at').nullable();

    // Indexes
    table.index(['role'], 'idx_users_role');
    table.index(['status'], 'idx_users_status');
    table.index(['phone'], 'idx_users_phone');
    table.index(['deleted_at'], 'idx_users_deleted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
