const crypto = require('crypto');
const { Model } = require('../db');

class B2BPricingRule extends Model {
  static get tableName() {
    return 'b2b_pricing_rules';
  }

  // Application-level allowed discount types
  static get DISCOUNT_TYPES() {
    return {
      PERCENTAGE: 'percentage',
      FIXED: 'fixed',
    };
  }

  // Common discount tier tokens
  static get DISCOUNT_TIERS() {
    return {
      BRONZE: 'bronze',
      SILVER: 'silver',
      GOLD: 'gold',
      PLATINUM: 'platinum',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.min_quantity === undefined || this.min_quantity === null) {
      this.min_quantity = 1;
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
      required: ['discount_tier', 'discount_type', 'discount_value'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        discount_tier: { type: 'string', minLength: 1, maxLength: 50 },
        product_id: { type: ['integer', 'string', 'null'] },
        discount_type: {
          type: 'string',
          enum: ['percentage', 'fixed'],
        },
        discount_value: { type: ['number', 'string'] },
        min_quantity: { type: 'integer', minimum: 1, default: 1 },
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
          from: 'b2b_pricing_rules.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = B2BPricingRule;
