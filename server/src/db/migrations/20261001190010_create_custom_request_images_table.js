/**
 * Migration: create_custom_request_images_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('custom_request_images', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Custom request reference
    table.bigInteger('custom_request_id').unsigned().notNullable();

    // Image details
    table.string('image_url', 500).notNullable();
    table.string('cloudinary_public_id', 255).nullable();
    table.integer('sort_order').notNullable().defaultTo(0);

    // Timestamps
    table.dateTime('created_at').notNullable();

    // Foreign key constraint (CASCADE deletion when custom request is removed)
    table
      .foreign('custom_request_id', 'fk_custom_request_images_request_id')
      .references('id')
      .inTable('custom_requests')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['custom_request_id'], 'idx_custom_request_images_request_id');
    table.index(['sort_order'], 'idx_custom_request_images_sort_order');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('custom_request_images');
};
