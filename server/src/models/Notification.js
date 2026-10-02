const crypto = require('crypto');
const { Model } = require('../db');

class Notification extends Model {
  static get tableName() {
    return 'notifications';
  }

  static get jsonAttributes() {
    return ['data'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.channel) {
      this.channel = 'in_app';
    }
    if (this.is_read === undefined || this.is_read === null) {
      this.is_read = false;
    }
    if (this.read_at === undefined) {
      this.read_at = null;
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
      required: ['type', 'title', 'message'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        user_id: { type: ['integer', 'string', 'null'] },
        type: { type: 'string', minLength: 1, maxLength: 50 },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        message: { type: 'string', minLength: 1 },
        data: { type: ['object', 'array', 'string', 'null'] },
        channel: { type: 'string', maxLength: 30, default: 'in_app' },
        is_read: { type: 'boolean', default: false },
        read_at: { type: ['string', 'object', 'null'] },
        related_entity_type: { type: ['string', 'null'], maxLength: 50 },
        related_entity_id: { type: ['integer', 'string', 'null'] },
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
          from: 'notifications.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = Notification;
