const crypto = require('crypto');
const { Model } = require('../db');

class Product extends Model {
  static get tableName() {
    return 'products';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      ARCHIVED: 'archived',
    };
  }

  static get jsonAttributes() {
    return ['features', 'sizes', 'meta_data'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'draft';
    }
    if (this.customizable === undefined || this.customizable === null) {
      this.customizable = false;
    }
    if (this.featured === undefined || this.featured === null) {
      this.featured = false;
    }
    if (this.ar_enabled === undefined || this.ar_enabled === null) {
      this.ar_enabled = false;
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
      required: ['category_id', 'name', 'slug', 'product_code'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        category_id: { type: ['integer', 'string'] },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        slug: { type: 'string', minLength: 1, maxLength: 220 },
        product_code: { type: 'string', minLength: 1, maxLength: 100 },
        short_description: { type: ['string', 'null'], maxLength: 500 },
        description: { type: ['string', 'null'] },
        material: { type: ['string', 'null'], maxLength: 150 },
        finish: { type: ['string', 'null'], maxLength: 150 },
        color: { type: ['string', 'null'], maxLength: 100 },
        features: { type: ['object', 'array', 'string', 'null'] },
        sizes: { type: ['object', 'array', 'string', 'null'] },
        customizable: { type: ['boolean', 'integer'], default: false },
        featured: { type: ['boolean', 'integer'], default: false },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          default: 'draft',
        },
        meta_data: { type: ['object', 'array', 'string', 'null'] },
        seo_title: { type: ['string', 'null'], maxLength: 255 },
        seo_description: { type: ['string', 'null'] },
        model_3d_url: { type: ['string', 'null'], maxLength: 500 },
        ar_enabled: { type: ['boolean', 'integer'], default: false },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Category = require('./Category');
    const ProductImage = require('./ProductImage');
    const ProductVideo = require('./ProductVideo');
    const ProductSpec = require('./ProductSpec');
    const Enquiry = require('./Enquiry');
    const B2BPricingRule = require('./B2BPricingRule');
    const Review = require('./Review');

    return {
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'products.category_id',
          to: 'categories.id',
        },
      },
      images: {
        relation: Model.HasManyRelation,
        modelClass: ProductImage,
        join: {
          from: 'products.id',
          to: 'product_images.product_id',
        },
      },
      videos: {
        relation: Model.HasManyRelation,
        modelClass: ProductVideo,
        join: {
          from: 'products.id',
          to: 'product_videos.product_id',
        },
      },
      specs: {
        relation: Model.HasManyRelation,
        modelClass: ProductSpec,
        join: {
          from: 'products.id',
          to: 'product_specs.product_id',
        },
      },
      enquiries: {
        relation: Model.HasManyRelation,
        modelClass: Enquiry,
        join: {
          from: 'products.id',
          to: 'enquiries.product_id',
        },
      },
      b2bPricingRules: {
        relation: Model.HasManyRelation,
        modelClass: B2BPricingRule,
        join: {
          from: 'products.id',
          to: 'b2b_pricing_rules.product_id',
        },
      },
      reviews: {
        relation: Model.HasManyRelation,
        modelClass: Review,
        join: {
          from: 'products.id',
          to: 'reviews.product_id',
        },
      },
      quotationItems: {
        relation: Model.HasManyRelation,
        modelClass: require('./QuotationItem'),
        join: {
          from: 'products.id',
          to: 'quotation_items.product_id',
        },
      },
      orderItems: {
        relation: Model.HasManyRelation,
        modelClass: require('./OrderItem'),
        join: {
          from: 'products.id',
          to: 'order_items.product_id',
        },
      },
    };
  }
}

module.exports = Product;
