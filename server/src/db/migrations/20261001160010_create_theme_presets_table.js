/**
 * Migration: create_theme_presets_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('theme_presets', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Preset details
    table.string('name', 150).notNullable();
    table.text('description').nullable();
    table.json('theme_config').notNullable();
    table.string('preview_image', 500).nullable();

    // System preset flag
    table.boolean('is_system').notNullable().defaultTo(false);

    // Audit
    table.bigInteger('created_by').unsigned().nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint
    table
      .foreign('created_by', 'fk_theme_presets_created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['created_by'], 'idx_theme_presets_created_by');
    table.index(['is_system'], 'idx_theme_presets_is_system');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('theme_presets');
};
