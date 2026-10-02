/**
 * Migration: create_notifications_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Recipient user (optional / nullable, CASCADE on delete)
    table.bigInteger('user_id').unsigned().nullable();

    // Notification type identifier
    table.string('type', 50).notNullable();

    // Notification header and content
    table.string('title', 200).notNullable();
    table.text('message').notNullable();

    // Structured metadata payload
    table.json('data').nullable();

    // Delivery channel (default: in_app)
    table.string('channel', 30).notNullable().defaultTo('in_app');

    // Read state
    table.boolean('is_read').notNullable().defaultTo(false);
    table.dateTime('read_at').nullable();

    // Polymorphic reference to related entity (no FK)
    table.string('related_entity_type', 50).nullable();
    table.bigInteger('related_entity_id').unsigned().nullable();

    // Timestamps
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    table.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());

    // Foreign key constraint (CASCADE deletion when user is deleted)
    table
      .foreign('user_id', 'fk_notifications_user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['user_id'], 'idx_notifications_user_id');
    table.index(['is_read'], 'idx_notifications_is_read');
    table.index(['type'], 'idx_notifications_type');
    table.index(['created_at'], 'idx_notifications_created_at');
    table.index(['related_entity_type', 'related_entity_id'], 'idx_notifications_related_entity');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};
