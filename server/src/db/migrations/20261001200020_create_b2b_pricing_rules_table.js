/**
 * Migration: create_b2b_pricing_rules_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('b2b_pricing_rules', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Tier criteria
    table.string('discount_tier', 50).notNullable();

    // Product reference (NULL means tier-wide rule; NOT NULL means product-specific override)
    table.bigInteger('product_id').unsigned().nullable();

    // Discount terms
    table.string('discount_type', 30).notNullable();
    table.decimal('discount_value', 12, 2).notNullable();
    table.integer('min_quantity').unsigned().notNullable().defaultTo(1);

    // Rule state
    table.boolean('is_active').notNullable().defaultTo(true);

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (SET NULL on product deletion preserves pricing tier rule)
    table
      .foreign('product_id', 'fk_b2b_pricing_rules_product_id')
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['discount_tier'], 'idx_b2b_pricing_rules_discount_tier');
    table.index(['product_id'], 'idx_b2b_pricing_rules_product_id');
    table.index(['discount_type'], 'idx_b2b_pricing_rules_discount_type');
    table.index(['min_quantity'], 'idx_b2b_pricing_rules_min_quantity');
    table.index(['is_active'], 'idx_b2b_pricing_rules_is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2b_pricing_rules');
};
