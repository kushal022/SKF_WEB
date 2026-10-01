const crypto = require('crypto');
const { Model } = require('../db');

class Payment extends Model {
  static get tableName() {
    return 'payments';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      PENDING: 'pending',
      PAID: 'paid',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      PARTIALLY_REFUNDED: 'partially_refunded',
    };
  }

  // Payment gateway identifiers
  static get GATEWAYS() {
    return {
      CASHFREE: 'cashfree',
      RAZORPAY: 'razorpay',
    };
  }

  static get jsonAttributes() {
    return ['metadata'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'pending';
    }
    if (!this.currency) {
      this.currency = 'INR';
    }
    if (this.amount === undefined || this.amount === null) {
      this.amount = 0;
    }

    const now = new Date();
    if (!this.created_at) {
      this.created_at = now;
    }
    if (!this.updated_at) {
      this.updated_at = now;
    }
  }

  $beforeUpdate() {
    this.updated_at = new Date();
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['order_id', 'payment_reference'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        order_id: { type: ['integer', 'string'] },
        payment_reference: { type: 'string', minLength: 1, maxLength: 100 },
        gateway: { type: ['string', 'null'], maxLength: 30 },
        gateway_order_id: { type: ['string', 'null'], maxLength: 150 },
        gateway_payment_id: { type: ['string', 'null'], maxLength: 150 },
        amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        currency: { type: 'string', maxLength: 10, default: 'INR' },
        status: {
          type: 'string',
          enum: [
            'pending',
            'paid',
            'failed',
            'refunded',
            'partially_refunded',
          ],
          default: 'pending',
        },
        paid_at: { type: ['string', 'object', 'null'] },
        failure_reason: { type: ['string', 'null'] },
        metadata: { type: ['object', 'array', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Order = require('./Order');

    return {
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'payments.order_id',
          to: 'orders.id',
        },
      },
    };
  }
}

module.exports = Payment;
