/**
 * Migration: create_products_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('products', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Mandatory category reference
    table.bigInteger('category_id').unsigned().notNullable();

    // Core product identity
    table.string('name', 200).notNullable();
    table.string('slug', 220).notNullable().unique();
    table.string('product_code', 100).notNullable().unique();

    // Descriptions
    table.string('short_description', 500).nullable();
    table.text('description').nullable();

    // Specifications & Materials
    table.string('material', 150).nullable();
    table.string('finish', 150).nullable();
    table.string('color', 100).nullable();

    // Flexible attributes
    table.json('features').nullable();
    table.json('sizes').nullable();

    // Product flags & lifecycle
    table.boolean('customizable').notNullable().defaultTo(false);
    table.boolean('featured').notNullable().defaultTo(false);
    table.string('status', 30).notNullable().defaultTo('draft');

    // Meta & SEO
    table.json('meta_data').nullable();
    table.string('seo_title', 255).nullable();
    table.text('seo_description').nullable();

    // 3D & Augmented Reality assets
    table.string('model_3d_url', 500).nullable();
    table.boolean('ar_enabled').notNullable().defaultTo(false);

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (RESTRICT prevents deleting categories with products)
    table
      .foreign('category_id', 'fk_products_category_id')
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['category_id'], 'idx_products_category_id');
    table.index(['status'], 'idx_products_status');
    table.index(['featured'], 'idx_products_featured');
    table.index(['customizable'], 'idx_products_customizable');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('products');
};
