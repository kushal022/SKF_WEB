const crypto = require('crypto');
const { Model } = require('../db');

class Gallery extends Model {
  static get tableName() {
    return 'galleries';
  }

  // Application-level allowed statuses
  static get STATUSES() {
    return {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      ARCHIVED: 'archived',
    };
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (!this.status) {
      this.status = 'draft';
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
      required: ['title', 'slug'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        slug: { type: 'string', minLength: 1, maxLength: 220 },
        category: { type: ['string', 'null'], maxLength: 100 },
        description: { type: ['string', 'null'] },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          default: 'draft',
        },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const GalleryImage = require('./GalleryImage');

    return {
      galleryImages: {
        relation: Model.HasManyRelation,
        modelClass: GalleryImage,
        join: {
          from: 'galleries.id',
          to: 'gallery_images.gallery_id',
        },
      },
    };
  }
}

module.exports = Gallery;
