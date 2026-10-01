/**
 * Migration: create_payments_table
 * Approved SKF Stainless Steel Furniture Database Master Design
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('payments', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.collate('utf8mb4_unicode_ci');

    // Internal primary key
    table.bigIncrements('id').unsigned().primary();

    // Public exposure ID (UUIDv4)
    table.specificType('public_id', 'CHAR(36)').notNullable().unique();

    // Parent order reference
    table.bigInteger('order_id').unsigned().notNullable();

    // Payment reference (unique business reference, e.g. SKF-PAY-2026-000001)
    table.string('payment_reference', 100).notNullable().unique();

    // Gateway details (flexible VARCHAR to support cashfree, razorpay, etc.)
    table.string('gateway', 30).nullable();
    table.string('gateway_order_id', 150).nullable();
    table.string('gateway_payment_id', 150).nullable();

    // Financial breakdown (DECIMAL(12,2) for exact currency calculation)
    table.decimal('amount', 12, 2).notNullable().defaultTo(0);
    table.string('currency', 10).notNullable().defaultTo('INR');

    // Payment status
    table.string('status', 30).notNullable().defaultTo('pending');

    // Payment completion timestamp
    table.dateTime('paid_at').nullable();

    // Failure reason / error description
    table.text('failure_reason').nullable();

    // Additional gateway/payment metadata
    table.json('metadata').nullable();

    // Timestamps
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();

    // Foreign key constraint (CASCADE deletion when order is removed)
    table
      .foreign('order_id', 'fk_payments_order_id')
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['order_id'], 'idx_payments_order_id');
    table.index(['status'], 'idx_payments_status');
    table.index(['gateway'], 'idx_payments_gateway');
    table.index(['gateway_order_id'], 'idx_payments_gateway_order_id');
    table.index(['gateway_payment_id'], 'idx_payments_gateway_payment_id');
    table.index(['created_at'], 'idx_payments_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payments');
};
