const crypto = require('crypto');
const { Model } = require('../db');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
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
      required: ['name', 'password_hash'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        name: { type: 'string', minLength: 1, maxLength: 150 },
        email: { type: ['string', 'null'], maxLength: 255 },
        phone: { type: ['string', 'null'], maxLength: 20 },
        password_hash: { type: 'string', maxLength: 255 },
        role: { type: 'string', maxLength: 30, default: 'admin' },
        status: { type: 'string', maxLength: 30, default: 'active' },
        last_login_at: { type: ['string', 'object', 'null'] },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
        deleted_at: { type: ['string', 'object', 'null'] },
      },
    };
  }

  static get relationMappings() {
    const Session = require('./Session');
    const ThemeSetting = require('./ThemeSetting');
    const ThemePreset = require('./ThemePreset');
    const EnquiryNote = require('./EnquiryNote');
    const EnquiryStatusLog = require('./EnquiryStatusLog');
    const EnquiryFollowUp = require('./EnquiryFollowUp');

    return {
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: Session,
        join: {
          from: 'users.id',
          to: 'sessions.user_id',
        },
      },
      themeSettings: {
        relation: Model.HasManyRelation,
        modelClass: ThemeSetting,
        join: {
          from: 'users.id',
          to: 'theme_settings.created_by',
        },
      },
      themePresets: {
        relation: Model.HasManyRelation,
        modelClass: ThemePreset,
        join: {
          from: 'users.id',
          to: 'theme_presets.created_by',
        },
      },
      enquiryNotes: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryNote,
        join: {
          from: 'users.id',
          to: 'enquiry_notes.user_id',
        },
      },
      enquiryStatusLogs: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryStatusLog,
        join: {
          from: 'users.id',
          to: 'enquiry_status_logs.changed_by',
        },
      },
      assignedFollowUps: {
        relation: Model.HasManyRelation,
        modelClass: EnquiryFollowUp,
        join: {
          from: 'users.id',
          to: 'enquiry_follow_ups.assigned_to',
        },
      },
    };
  }
}

module.exports = User;
