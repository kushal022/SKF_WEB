const crypto = require('crypto');
const { Model } = require('../db');

class AuditLog extends Model {
  static get tableName() {
    return 'audit_logs';
  }

  static get jsonAttributes() {
    return ['old_values', 'new_values', 'metadata'];
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
        builder.orderBy('created_at', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['action'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        user_id: { type: ['integer', 'string', 'null'] },
        action: { type: 'string', minLength: 1, maxLength: 100 },
        entity_type: { type: ['string', 'null'], maxLength: 50 },
        entity_id: { type: ['integer', 'string', 'null'] },
        old_values: { type: ['object', 'array', 'string', 'null'] },
        new_values: { type: ['object', 'array', 'string', 'null'] },
        metadata: { type: ['object', 'array', 'string', 'null'] },
        ip_address: { type: ['string', 'null'], maxLength: 45 },
        user_agent: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'audit_logs.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = AuditLog;
