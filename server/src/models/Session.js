const crypto = require('crypto');
const { Model } = require('../db');

class Session extends Model {
  static get tableName() {
    return 'sessions';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
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
      required: ['user_id', 'refresh_token_hash', 'expires_at'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        user_id: { type: ['integer', 'string'] },
        refresh_token_hash: { type: 'string', maxLength: 255 },
        device_info: { type: ['string', 'null'], maxLength: 255 },
        ip_address: { type: ['string', 'null'], maxLength: 45 },
        user_agent: { type: ['string', 'null'] },
        expires_at: { type: ['string', 'object'] },
        revoked_at: { type: ['string', 'object', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
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
          from: 'sessions.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = Session;
