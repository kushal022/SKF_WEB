/**
 * Migration: create_product_images_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_images', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Product reference
    table.bigInteger('product_id').unsigned().notNullable();

    // Image details & Cloudinary storage
    table.string('image_url', 500).notNullable();
    table.string('public_cloudinary_id', 255).nullable();
    table.string('alt_text', 255).nullable();
    table.string('image_type', 50).nullable();

    // Ordering & Display
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_primary').notNullable().defaultTo(false);

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (CASCADE deletion when product is removed)
    table
      .foreign('product_id', 'fk_product_images_product_id')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['product_id'], 'idx_product_images_product_id');
    table.index(['sort_order'], 'idx_product_images_sort_order');
    table.index(['is_primary'], 'idx_product_images_is_primary');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_images');
};
