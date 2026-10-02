const crypto = require('crypto');
const { Model } = require('../db');

class WebsiteSetting extends Model {
  static get tableName() {
    return 'website_settings';
  }

  static get jsonAttributes() {
    return ['business_hours', 'social_links', 'seo_defaults'];
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
      required: ['site_name'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        site_name: { type: 'string', minLength: 1, maxLength: 150 },
        tagline: { type: ['string', 'null'], maxLength: 255 },
        logo_url: { type: ['string', 'null'], maxLength: 500 },
        favicon_url: { type: ['string', 'null'], maxLength: 500 },
        phone: { type: ['string', 'null'], maxLength: 20 },
        whatsapp_number: { type: ['string', 'null'], maxLength: 20 },
        email: { type: ['string', 'null'], maxLength: 255 },
        address: { type: ['string', 'null'] },
        business_hours: { type: ['object', 'array', 'string', 'null'] },
        social_links: { type: ['object', 'array', 'string', 'null'] },
        seo_defaults: { type: ['object', 'array', 'string', 'null'] },
        active_theme_id: { type: ['integer', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const ThemeSetting = require('./ThemeSetting');

    return {
      activeTheme: {
        relation: Model.BelongsToOneRelation,
        modelClass: ThemeSetting,
        join: {
          from: 'website_settings.active_theme_id',
          to: 'theme_settings.id',
        },
      },
    };
  }
}

module.exports = WebsiteSetting;
