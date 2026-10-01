const crypto = require('crypto');
const { Model } = require('../db');

class ProductSpec extends Model {
  static get tableName() {
    return 'product_specs';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.sort_order === undefined || this.sort_order === null) {
      this.sort_order = 0;
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
      required: ['product_id', 'spec_name', 'spec_value'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        product_id: { type: ['integer', 'string'] },
        spec_name: { type: 'string', minLength: 1, maxLength: 150 },
        spec_value: { type: 'string', minLength: 1, maxLength: 500 },
        sort_order: { type: 'integer', default: 0 },
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
          from: 'product_specs.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = ProductSpec;
