/**
 * Migration: create_theme_settings_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('theme_settings', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Theme identification
    table.string('name', 150).notNullable();

    // Color palette
    table.string('primary_color', 20).nullable();
    table.string('secondary_color', 20).nullable();
    table.string('accent_color', 20).nullable();
    table.string('background_color', 20).nullable();
    table.string('surface_color', 20).nullable();
    table.string('text_color', 20).nullable();
    table.string('muted_text_color', 20).nullable();
    table.string('border_color', 20).nullable();
    table.string('success_color', 20).nullable();
    table.string('warning_color', 20).nullable();
    table.string('error_color', 20).nullable();

    // Typography
    table.string('heading_font', 100).nullable();
    table.string('body_font', 100).nullable();
    table.string('heading_weight', 20).nullable();
    table.string('body_weight', 20).nullable();

    // Layout & Component styles
    table.string('border_radius', 30).nullable();
    table.string('button_style', 50).nullable();
    table.string('card_style', 50).nullable();

    // Lifecycle status & versioning (VARCHAR for flexible extension, avoiding MySQL ENUM)
    table.string('status', 30).notNullable().defaultTo('draft');
    table.integer('version').unsigned().notNullable().defaultTo(1);

    // Audit and publication
    table.bigInteger('created_by').unsigned().nullable();
    table.dateTime('published_at').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint
    table
      .foreign('created_by', 'fk_theme_settings_created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['status'], 'idx_theme_settings_status');
    table.index(['created_by'], 'idx_theme_settings_created_by');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('theme_settings');
};
