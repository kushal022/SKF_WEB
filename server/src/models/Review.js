const crypto = require('crypto');
const { Model } = require('../db');

class Review extends Model {
  static get tableName() {
    return 'reviews';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'pending';
    }
    if (this.is_featured === undefined || this.is_featured === null) {
      this.is_featured = false;
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
      required: ['customer_name', 'rating', 'review_text'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        customer_name: { type: 'string', minLength: 1, maxLength: 150 },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        review_text: { type: 'string', minLength: 1 },
        product_id: { type: ['integer', 'string', 'null'] },
        is_featured: { type: ['boolean', 'integer'], default: false },
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
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
          from: 'reviews.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = Review;
