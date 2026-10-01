/**
 * Migration: create_website_settings_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('website_settings', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Basic site identity
    table.string('site_name', 150).notNullable();
    table.string('tagline', 255).nullable();
    table.string('logo_url', 500).nullable();
    table.string('favicon_url', 500).nullable();

    // Contact information
    table.string('phone', 20).nullable();
    table.string('whatsapp_number', 20).nullable();
    table.string('email', 255).nullable();
    table.text('address').nullable();

    // Flexible configurations
    table.json('business_hours').nullable();
    table.json('social_links').nullable();
    table.json('seo_defaults').nullable();

    // Active theme reference
    table.bigInteger('active_theme_id').unsigned().nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint
    table
      .foreign('active_theme_id', 'fk_website_settings_active_theme_id')
      .references('id')
      .inTable('theme_settings')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['active_theme_id'], 'idx_website_settings_active_theme_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('website_settings');
};
