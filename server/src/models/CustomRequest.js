const crypto = require('crypto');
const { Model } = require('../db');

class CustomRequest extends Model {
  static get tableName() {
    return 'custom_requests';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      NEW: 'new',
      REVIEWING: 'reviewing',
      QUOTED: 'quoted',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      COMPLETED: 'completed',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.quantity === undefined || this.quantity === null) {
      this.quantity = 1;
    }
    if (!this.status) {
      this.status = 'new';
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
      required: ['product_type', 'customer_name', 'phone'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        product_type: { type: 'string', minLength: 1, maxLength: 150 },
        width: { type: ['number', 'string', 'null'] },
        length: { type: ['number', 'string', 'null'] },
        height: { type: ['number', 'string', 'null'] },
        dimension_unit: { type: ['string', 'null'], maxLength: 20 },
        material: { type: ['string', 'null'], maxLength: 150 },
        finish: { type: ['string', 'null'], maxLength: 150 },
        quantity: { type: 'integer', minimum: 1, default: 1 },
        customer_name: { type: 'string', minLength: 1, maxLength: 150 },
        phone: { type: 'string', minLength: 1, maxLength: 20 },
        email: { type: ['string', 'null'], maxLength: 255 },
        city: { type: ['string', 'null'], maxLength: 100 },
        requirement: { type: ['string', 'null'] },
        estimated_amount: { type: ['number', 'string', 'null'] },
        status: {
          type: 'string',
          enum: ['new', 'reviewing', 'quoted', 'approved', 'rejected', 'completed'],
          default: 'new',
        },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const CustomRequestImage = require('./CustomRequestImage');
    const Enquiry = require('./Enquiry');

    return {
      images: {
        relation: Model.HasManyRelation,
        modelClass: CustomRequestImage,
        join: {
          from: 'custom_requests.id',
          to: 'custom_request_images.custom_request_id',
        },
      },
      enquiries: {
        relation: Model.HasManyRelation,
        modelClass: Enquiry,
        join: {
          from: 'custom_requests.id',
          to: 'enquiries.custom_request_id',
        },
      },
    };
  }
}

module.exports = CustomRequest;
