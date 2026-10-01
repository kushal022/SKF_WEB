/**
 * Migration: create_gallery_images_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('gallery_images', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Gallery reference
    table.bigInteger('gallery_id').unsigned().notNullable();

    // Image details
    table.string('image_url', 500).notNullable();
    table.string('cloudinary_public_id', 255).nullable();
    table.string('alt_text', 255).nullable();
    table.integer('sort_order').notNullable().defaultTo(0);

    // Timestamps
    table.dateTime('created_at').notNullable();

    // Foreign key constraint (CASCADE deletion when gallery is removed)
    table
      .foreign('gallery_id', 'fk_gallery_images_gallery_id')
      .references('id')
      .inTable('galleries')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['gallery_id'], 'idx_gallery_images_gallery_id');
    table.index(['sort_order'], 'idx_gallery_images_sort_order');
    table.index(['created_at'], 'idx_gallery_images_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('gallery_images');
};
