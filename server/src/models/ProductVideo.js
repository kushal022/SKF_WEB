const crypto = require('crypto');
const { Model } = require('../db');

class ProductVideo extends Model {
  static get tableName() {
    return 'product_videos';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.sort_order === undefined || this.sort_order === null) {
      this.sort_order = 0;
    }
    if (this.is_active === undefined || this.is_active === null) {
      this.is_active = true;
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
      required: ['product_id', 'video_url'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        product_id: { type: ['integer', 'string'] },
        video_url: { type: 'string', minLength: 1, maxLength: 500 },
        thumbnail_url: { type: ['string', 'null'], maxLength: 500 },
        title: { type: ['string', 'null'], maxLength: 200 },
        sort_order: { type: 'integer', default: 0 },
        is_active: { type: ['boolean', 'integer'], default: true },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Product = require('./Product');

    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'product_videos.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = ProductVideo;
