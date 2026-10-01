const crypto = require('crypto');
const { Model } = require('../db');

class OrderStatusLog extends Model {
  static get tableName() {
    return 'order_status_logs';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.created_at) {
      this.created_at = new Date();
    }
  }

  static get modifiers() {
    return {
      orderByCreated(builder) {
        builder.orderBy('created_at', 'asc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['order_id', 'to_status'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        order_id: { type: ['integer', 'string'] },
        changed_by: { type: ['integer', 'string', 'null'] },
        from_status: { type: ['string', 'null'], maxLength: 30 },
        to_status: { type: 'string', minLength: 1, maxLength: 30 },
        comment: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Order = require('./Order');
    const User = require('./User');

    return {
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'order_status_logs.order_id',
          to: 'orders.id',
        },
      },
      changedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'order_status_logs.changed_by',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = OrderStatusLog;
