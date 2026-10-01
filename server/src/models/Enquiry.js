const crypto = require('crypto');
const { Model } = require('../db');

class Enquiry extends Model {
  static get tableName() {
    return 'enquiries';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      NEW: 'new',
      CONTACTED: 'contacted',
      QUOTATION_SENT: 'quotation_sent',
      NEGOTIATION: 'negotiation',
      CONFIRMED: 'confirmed',
      COMPLETED: 'completed',
      LOST: 'lost',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
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
      required: ['customer_name', 'phone'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        customer_name: { type: 'string', minLength: 1, maxLength: 150 },
        phone: { type: 'string', minLength: 1, maxLength: 20 },
        email: { type: ['string', 'null'], maxLength: 255 },
        product_id: { type: ['integer', 'string', 'null'] },
        custom_request_id: { type: ['integer', 'string', 'null'] },
        source: { type: ['string', 'null'], maxLength: 50 },
        message: { type: ['string', 'null'] },
        status: {
          type: 'string',
          enum: [
            'new',
            'contacted',
            'quotation_sent',
            'negotiation',
            'confirmed',
            'completed',
            'lost',
          ],
          default: 'new',
        },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Product = require('./Product');
    const EnquiryNote = require('./EnquiryNote');
    const EnquiryStatusLog = require('./EnquiryStatusLog');
    const EnquiryFollowUp = require('./EnquiryFollowUp');
    const CustomRequest = require('./CustomRequest');

    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'enquiries.product_id',
          to: 'products.id',
        },
      },
      customRequest: {
        relation: Model.BelongsToOneRelation,
        modelClass: CustomRequest,
        join: {
          from: 'enquiries.custom_request_id',
          to: 'custom_requests.id',
        },
      },
      notes: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryNote,
        join: {
          from: 'enquiries.id',
          to: 'enquiry_notes.enquiry_id',
        },
      },
      statusLogs: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryStatusLog,
        join: {
          from: 'enquiries.id',
          to: 'enquiry_status_logs.enquiry_id',
        },
      },
      followUps: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryFollowUp,
        join: {
          from: 'enquiries.id',
          to: 'enquiry_follow_ups.enquiry_id',
        },
      },
    };
  }
}

module.exports = Enquiry;
