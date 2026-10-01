const crypto = require('crypto');
const { Model } = require('../db');

class B2BAccount extends Model {
  static get tableName() {
    return 'b2b_accounts';
  }

  // Application-level allowed statuses
  static get VERIFICATION_STATUSES() {
    return {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      SUSPENDED: 'suspended',
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
    if (!this.verification_status) {
      this.verification_status = 'pending';
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
      required: ['company_name', 'contact_name', 'phone'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        company_name: { type: 'string', minLength: 1, maxLength: 200 },
        contact_name: { type: 'string', minLength: 1, maxLength: 150 },
        email: { type: ['string', 'null'], maxLength: 255 },
        phone: { type: 'string', minLength: 1, maxLength: 20 },
        business_type: { type: ['string', 'null'], maxLength: 100 },
        gst_number: { type: ['string', 'null'], maxLength: 30 },
        address: { type: ['string', 'null'] },
        verification_status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected', 'suspended'],
          default: 'pending',
        },
        discount_tier: { type: ['string', 'null'], maxLength: 50 },
        notes: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const B2BDocument = require('./B2BDocument');
    const B2BPricingRule = require('./B2BPricingRule');

    return {
      documents: {
        relation: Model.HasManyRelation,
        modelClass: B2BDocument,
        join: {
          from: 'b2b_accounts.id',
          to: 'b2b_documents.b2b_account_id',
        },
      },
      pricingRules: {
        relation: Model.HasManyRelation,
        modelClass: B2BPricingRule,
        join: {
          from: 'b2b_accounts.discount_tier',
          to: 'b2b_pricing_rules.discount_tier',
        },
      },
      quotations: {
        relation: Model.HasManyRelation,
        modelClass: require('./Quotation'),
        join: {
          from: 'b2b_accounts.id',
          to: 'quotations.b2b_account_id',
        },
      },
    };
  }
}

module.exports = B2BAccount;
