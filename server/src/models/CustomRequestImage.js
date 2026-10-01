const crypto = require('crypto');
const { Model } = require('../db');

class CustomRequestImage extends Model {
  static get tableName() {
    return 'custom_request_images';
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.sort_order === undefined || this.sort_order === null) {
      this.sort_order = 0;
    }
    if (!this.created_at) {
      this.created_at = new Date();
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['custom_request_id', 'image_url'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        custom_request_id: { type: ['integer', 'string'] },
        image_url: { type: 'string', minLength: 1, maxLength: 500 },
        cloudinary_public_id: { type: ['string', 'null'], maxLength: 255 },
        sort_order: { type: 'integer', default: 0 },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const CustomRequest = require('./CustomRequest');

    return {
      customRequest: {
        relation: Model.BelongsToOneRelation,
        modelClass: CustomRequest,
        join: {
          from: 'custom_request_images.custom_request_id',
          to: 'custom_requests.id',
        },
      },
    };
  }
}

module.exports = CustomRequestImage;
