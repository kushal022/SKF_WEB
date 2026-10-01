const crypto = require('crypto');
const { Model } = require('../db');

class ThemePreset extends Model {
  static get tableName() {
    return 'theme_presets';
  }

  static get jsonAttributes() {
    return ['theme_config'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.is_system === undefined || this.is_system === null) {
      this.is_system = false;
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
      required: ['name', 'theme_config'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        name: { type: 'string', minLength: 1, maxLength: 150 },
        description: { type: ['string', 'null'] },
        theme_config: { type: ['object', 'string'] },
        preview_image: { type: ['string', 'null'], maxLength: 500 },
        is_system: { type: ['boolean', 'integer'], default: false },
        created_by: { type: ['integer', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'theme_presets.created_by',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = ThemePreset;
