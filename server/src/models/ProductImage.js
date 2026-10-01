const crypto = require('crypto');
const { Model } = require('../db');

class ProductImage extends Model {
  static get tableName() {
    return 'product_images';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.sort_order === undefined || this.sort_order === null) {
      this.sort_order = 0;
    }
    if (this.is_primary === undefined || this.is_primary === null) {
      this.is_primary = false;
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
      required: ['product_id', 'image_url'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        product_id: { type: ['integer', 'string'] },
        image_url: { type: 'string', minLength: 1, maxLength: 500 },
        public_cloudinary_id: { type: ['string', 'null'], maxLength: 255 },
        alt_text: { type: ['string', 'null'], maxLength: 255 },
        image_type: { type: ['string', 'null'], maxLength: 50 },
        sort_order: { type: 'integer', default: 0 },
        is_primary: { type: ['boolean', 'integer'], default: false },
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
          from: 'product_images.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = ProductImage;
