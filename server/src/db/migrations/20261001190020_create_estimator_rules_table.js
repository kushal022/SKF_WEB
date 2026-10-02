/**
 * Migration: create_estimator_rules_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('estimator_rules', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Rule metadata & matching criteria
    table.string('name', 150).notNullable();
    table.string('product_type', 150).nullable();
    table.string('material', 150).nullable();
    table.string('finish', 150).nullable();

    // Estimation formula parameters
    table.decimal('dimension_multiplier', 12, 4).nullable();
    table.decimal('material_rate', 12, 2).nullable();
    table.decimal('finish_adjustment', 12, 2).nullable();
    table.decimal('base_rate', 12, 2).nullable();

    // Flexible rule configuration (JSON)
    table.json('rule_config').nullable();

    // Priority & State
    table.integer('priority').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Indexes
    table.index(['product_type'], 'idx_estimator_rules_product_type');
    table.index(['material'], 'idx_estimator_rules_material');
    table.index(['finish'], 'idx_estimator_rules_finish');
    table.index(['priority'], 'idx_estimator_rules_priority');
    table.index(['is_active'], 'idx_estimator_rules_is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('estimator_rules');
};
