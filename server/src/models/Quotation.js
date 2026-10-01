const crypto = require('crypto');
const { Model } = require('../db');

class Quotation extends Model {
  static get tableName() {
    return 'quotations';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      DRAFT: 'draft',
      SENT: 'sent',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'draft';
    }
    if (this.subtotal === undefined || this.subtotal === null) {
      this.subtotal = 0;
    }
    if (this.customization_amount === undefined || this.customization_amount === null) {
      this.customization_amount = 0;
    }
    if (this.transport_amount === undefined || this.transport_amount === null) {
      this.transport_amount = 0;
    }
    if (this.installation_amount === undefined || this.installation_amount === null) {
      this.installation_amount = 0;
    }
    if (this.discount_amount === undefined || this.discount_amount === null) {
      this.discount_amount = 0;
    }
    if (this.tax_amount === undefined || this.tax_amount === null) {
      this.tax_amount = 0;
    }
    if (this.total_amount === undefined || this.total_amount === null) {
      this.total_amount = 0;
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
      required: ['quotation_number', 'customer_name', 'customer_phone'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        quotation_number: { type: 'string', minLength: 1, maxLength: 50 },
        enquiry_id: { type: ['integer', 'string', 'null'] },
        b2b_account_id: { type: ['integer', 'string', 'null'] },
        customer_name: { type: 'string', minLength: 1, maxLength: 150 },
        customer_phone: { type: 'string', minLength: 1, maxLength: 20 },
        customer_email: { type: ['string', 'null'], maxLength: 255 },
        subtotal: { type: ['number', 'string'], minimum: 0, default: 0 },
        customization_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        transport_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        installation_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        discount_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        tax_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        total_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        valid_until: { type: ['string', 'null'] },
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'],
          default: 'draft',
        },
        notes: { type: ['string', 'null'] },
        created_by: { type: ['integer', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Enquiry = require('./Enquiry');
    const B2BAccount = require('./B2BAccount');
    const QuotationItem = require('./QuotationItem');
    const QuotationStatusLog = require('./QuotationStatusLog');
    const User = require('./User');

    return {
      enquiry: {
        relation: Model.BelongsToOneRelation,
        modelClass: Enquiry,
        join: {
          from: 'quotations.enquiry_id',
          to: 'enquiries.id',
        },
      },
      b2bAccount: {
        relation: Model.BelongsToOneRelation,
        modelClass: B2BAccount,
        join: {
          from: 'quotations.b2b_account_id',
          to: 'b2b_accounts.id',
        },
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: QuotationItem,
        join: {
          from: 'quotations.id',
          to: 'quotation_items.quotation_id',
        },
      },
      statusLogs: {
        relation: Model.HasManyRelation,
        modelClass: QuotationStatusLog,
        join: {
          from: 'quotations.id',
          to: 'quotation_status_logs.quotation_id',
        },
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'quotations.created_by',
          to: 'users.id',
        },
      },
      orders: {
        relation: Model.HasManyRelation,
        modelClass: require('./Order'),
        join: {
          from: 'quotations.id',
          to: 'orders.quotation_id',
        },
      },
    };
  }
}

module.exports = Quotation;
