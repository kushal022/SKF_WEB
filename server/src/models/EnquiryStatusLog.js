const crypto = require('crypto');
const { Model } = require('../db');

class EnquiryStatusLog extends Model {
  static get tableName() {
    return 'enquiry_status_logs';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.created_at) {
      this.created_at = new Date();
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['enquiry_id', 'to_status'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        enquiry_id: { type: ['integer', 'string'] },
        from_status: { type: ['string', 'null'], maxLength: 30 },
        to_status: { type: 'string', minLength: 1, maxLength: 30 },
        changed_by: { type: ['integer', 'string', 'null'] },
        comment: { type: ['string', 'null'] },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Enquiry = require('./Enquiry');
    const User = require('./User');

    return {
      enquiry: {
        relation: Model.BelongsToOneRelation,
        modelClass: Enquiry,
        join: {
          from: 'enquiry_status_logs.enquiry_id',
          to: 'enquiries.id',
        },
      },
      changedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'enquiry_status_logs.changed_by',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = EnquiryStatusLog;
