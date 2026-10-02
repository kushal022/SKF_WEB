const crypto = require('crypto');
const { Model } = require('../db');

class ThemeSetting extends Model {
  static get tableName() {
    return 'theme_settings';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      ARCHIVED: 'archived',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'draft';
    }
    if (this.version === undefined || this.version === null) {
      this.version = 1;
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
      required: ['name'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        name: { type: 'string', minLength: 1, maxLength: 150 },

        // Colors
        primary_color: { type: ['string', 'null'], maxLength: 20 },
        secondary_color: { type: ['string', 'null'], maxLength: 20 },
        accent_color: { type: ['string', 'null'], maxLength: 20 },
        background_color: { type: ['string', 'null'], maxLength: 20 },
        surface_color: { type: ['string', 'null'], maxLength: 20 },
        text_color: { type: ['string', 'null'], maxLength: 20 },
        muted_text_color: { type: ['string', 'null'], maxLength: 20 },
        border_color: { type: ['string', 'null'], maxLength: 20 },
        success_color: { type: ['string', 'null'], maxLength: 20 },
        warning_color: { type: ['string', 'null'], maxLength: 20 },
        error_color: { type: ['string', 'null'], maxLength: 20 },

        // Typography
        heading_font: { type: ['string', 'null'], maxLength: 100 },
        body_font: { type: ['string', 'null'], maxLength: 100 },
        heading_weight: { type: ['string', 'null'], maxLength: 20 },
        body_weight: { type: ['string', 'null'], maxLength: 20 },

        // Styles
        border_radius: { type: ['string', 'null'], maxLength: 30 },
        button_style: { type: ['string', 'null'], maxLength: 50 },
        card_style: { type: ['string', 'null'], maxLength: 50 },

        // Status & Version
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          default: 'draft',
        },
        version: { type: 'integer', minimum: 1, default: 1 },

        // Audit & Publication
        created_by: { type: ['integer', 'string', 'null'] },
        published_at: { type: ['string', 'object', 'null'] },

        // Timestamps
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const WebsiteSetting = require('./WebsiteSetting');

    return {
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'theme_settings.created_by',
          to: 'users.id',
        },
      },
      websiteSettings: {
        relation: Model.HasManyRelation,
        modelClass: WebsiteSetting,
        join: {
          from: 'theme_settings.id',
          to: 'website_settings.active_theme_id',
        },
      },
    };
  }
}

module.exports = ThemeSetting;
