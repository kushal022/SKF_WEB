const crypto = require('crypto');
const { Model } = require('../db');

class EnquiryFollowUp extends Model {
  static get tableName() {
    return 'enquiry_follow_ups';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      PENDING: 'pending',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'pending';
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
      required: ['enquiry_id', 'follow_up_at'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        enquiry_id: { type: ['integer', 'string'] },
        assigned_to: { type: ['integer', 'string', 'null'] },
        follow_up_at: { type: ['string', 'object'] },
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'cancelled'],
          default: 'pending',
        },
        note: { type: ['string', 'null'] },
        completed_at: { type: ['string', 'object', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
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
          from: 'enquiry_follow_ups.enquiry_id',
          to: 'enquiries.id',
        },
      },
      assignedTo: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'enquiry_follow_ups.assigned_to',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = EnquiryFollowUp;
