/**
 * Migration: create_reviews_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('reviews', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Review content
    table.string('customer_name', 150).notNullable();
    table.tinyint('rating').unsigned().notNullable();
    table.text('review_text').notNullable();

    // Optional product reference (NULL = general business review)
    table.bigInteger('product_id').unsigned().nullable();

    // Flags & Moderation Status
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.string('status', 30).notNullable().defaultTo('pending');

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (SET NULL on product deletion preserves customer review)
    table
      .foreign('product_id', 'fk_reviews_product_id')
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['product_id'], 'idx_reviews_product_id');
    table.index(['is_featured'], 'idx_reviews_is_featured');
    table.index(['status'], 'idx_reviews_status');
    table.index(['created_at'], 'idx_reviews_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reviews');
};
