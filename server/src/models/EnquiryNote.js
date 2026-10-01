const crypto = require('crypto');
const { Model } = require('../db');

class EnquiryNote extends Model {
  static get tableName() {
    return 'enquiry_notes';
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
      required: ['enquiry_id', 'note'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        enquiry_id: { type: ['integer', 'string'] },
        user_id: { type: ['integer', 'string', 'null'] },
        note: { type: 'string', minLength: 1 },
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
          from: 'enquiry_notes.enquiry_id',
          to: 'enquiries.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'enquiry_notes.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = EnquiryNote;
