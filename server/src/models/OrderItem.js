const crypto = require('crypto');
const { Model } = require('../db');

class OrderItem extends Model {
  static get tableName() {
    return 'order_items';
  }

  static get jsonAttributes() {
    return ['metadata'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.quantity === undefined || this.quantity === null) {
      this.quantity = 1;
    }
    if (this.unit_price === undefined || this.unit_price === null) {
      this.unit_price = 0;
    }
    if (this.line_total === undefined || this.line_total === null) {
      this.line_total = 0;
    }
    if (!this.created_at) {
      this.created_at = new Date();
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['order_id', 'description'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        order_id: { type: ['integer', 'string'] },
        product_id: { type: ['integer', 'string', 'null'] },
        description: { type: 'string', minLength: 1, maxLength: 500 },
        quantity: { type: ['number', 'string'], default: 1 },
        unit_price: { type: ['number', 'string'], minimum: 0, default: 0 },
        line_total: { type: ['number', 'string'], minimum: 0, default: 0 },
        metadata: { type: ['object', 'array', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Order = require('./Order');
    const Product = require('./Product');

    return {
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'order_items.order_id',
          to: 'orders.id',
        },
      },
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'order_items.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = OrderItem;
