const crypto = require('crypto');
const { Model } = require('../db');

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      MANUFACTURING: 'manufacturing',
      READY: 'ready',
      DISPATCHED: 'dispatched',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'pending';
    }
    if (this.subtotal === undefined || this.subtotal === null) {
      this.subtotal = 0;
    }
    if (this.discount_amount === undefined || this.discount_amount === null) {
      this.discount_amount = 0;
    }
    if (this.tax_amount === undefined || this.tax_amount === null) {
      this.tax_amount = 0;
    }
    if (this.shipping_amount === undefined || this.shipping_amount === null) {
      this.shipping_amount = 0;
    }
    if (this.installation_amount === undefined || this.installation_amount === null) {
      this.installation_amount = 0;
    }
    if (this.total_amount === undefined || this.total_amount === null) {
      this.total_amount = 0;
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
      required: ['order_number', 'customer_name', 'customer_phone'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        order_number: { type: 'string', minLength: 1, maxLength: 50 },
        quotation_id: { type: ['integer', 'string', 'null'] },
        customer_name: { type: 'string', minLength: 1, maxLength: 150 },
        customer_phone: { type: 'string', minLength: 1, maxLength: 20 },
        customer_email: { type: ['string', 'null'], maxLength: 150 },
        subtotal: { type: ['number', 'string'], minimum: 0, default: 0 },
        discount_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        tax_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        shipping_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        installation_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        total_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        status: {
          type: 'string',
          enum: [
            'pending',
            'confirmed',
            'manufacturing',
            'ready',
            'dispatched',
            'delivered',
            'cancelled',
          ],
          default: 'pending',
        },
        notes: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Quotation = require('./Quotation');
    const OrderItem = require('./OrderItem');
    const OrderStatusLog = require('./OrderStatusLog');

    return {
      quotation: {
        relation: Model.BelongsToOneRelation,
        modelClass: Quotation,
        join: {
          from: 'orders.quotation_id',
          to: 'quotations.id',
        },
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: OrderItem,
        join: {
          from: 'orders.id',
          to: 'order_items.order_id',
        },
      },
      statusLogs: {
        relation: Model.HasManyRelation,
        modelClass: OrderStatusLog,
        join: {
          from: 'orders.id',
          to: 'order_status_logs.order_id',
        },
      },
      payments: {
        relation: Model.HasManyRelation,
        modelClass: require('./Payment'),
        join: {
          from: 'orders.id',
          to: 'payments.order_id',
        },
      },
    };
  }
}

module.exports = Order;
