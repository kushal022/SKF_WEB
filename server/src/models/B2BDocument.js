const crypto = require('crypto');
const { Model } = require('../db');

class B2BDocument extends Model {
  static get tableName() {
    return 'b2b_documents';
  }

  // Application-level allowed verification statuses
  static get VERIFICATION_STATUSES() {
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
      required: ['b2b_account_id', 'document_type', 'document_url'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        b2b_account_id: { type: ['integer', 'string'] },
        document_type: { type: 'string', minLength: 1, maxLength: 50 },
        document_url: { type: 'string', minLength: 1, maxLength: 500 },
        cloudinary_public_id: { type: ['string', 'null'], maxLength: 255 },
        verification_status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        rejection_reason: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const B2BAccount = require('./B2BAccount');

    return {
      b2bAccount: {
        relation: Model.BelongsToOneRelation,
        modelClass: B2BAccount,
        join: {
          from: 'b2b_documents.b2b_account_id',
          to: 'b2b_accounts.id',
        },
      },
    };
  }
}

module.exports = B2BDocument;
