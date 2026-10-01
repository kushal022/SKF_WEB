/**
 * Migration: create_categories_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('categories', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Hierarchy parent foreign key
    table.bigInteger('parent_id').unsigned().nullable();

    // Category identity
    table.string('name', 150).notNullable();
    table.string('slug', 180).notNullable().unique();
    table.text('description').nullable();
    table.string('image_url', 500).nullable();

    // Organization & Status
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);

    // SEO metadata
    table.string('seo_title', 255).nullable();
    table.text('seo_description').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Self-referencing Foreign Key
    table
      .foreign('parent_id', 'fk_categories_parent_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['parent_id'], 'idx_categories_parent_id');
    table.index(['is_active'], 'idx_categories_is_active');
    table.index(['sort_order'], 'idx_categories_sort_order');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('categories');
};
