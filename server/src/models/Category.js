const crypto = require('crypto');
const { Model } = require('../db');

class Category extends Model {
  static get tableName() {
    return 'categories';
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
      required: ['name', 'slug'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        parent_id: { type: ['integer', 'string', 'null'] },
        name: { type: 'string', minLength: 1, maxLength: 150 },
        slug: { type: 'string', minLength: 1, maxLength: 180 },
        description: { type: ['string', 'null'] },
        image_url: { type: ['string', 'null'], maxLength: 500 },
        sort_order: { type: 'integer', default: 0 },
        is_active: { type: ['boolean', 'integer'], default: true },
        seo_title: { type: ['string', 'null'], maxLength: 255 },
        seo_description: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Product = require('./Product');

    return {
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'categories.parent_id',
          to: 'categories.id',
        },
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: Category,
        join: {
          from: 'categories.id',
          to: 'categories.parent_id',
        },
      },
      products: {
        relation: Model.HasManyRelation,
        modelClass: Product,
        join: {
          from: 'categories.id',
          to: 'products.category_id',
        },
      },
    };
  }
}

module.exports = Category;
