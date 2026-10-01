const crypto = require('crypto');
const { Model } = require('../db');

class QuotationItem extends Model {
  static get tableName() {
    return 'quotation_items';
  }

  static get jsonAttributes() {
    return ['metadata'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.quantity === undefined || this.quantity === null) {
      this.quantity = 1;
    }
    if (this.unit_price === undefined || this.unit_price === null) {
      this.unit_price = 0;
    }
    if (this.customization_amount === undefined || this.customization_amount === null) {
      this.customization_amount = 0;
    }
    if (this.discount_amount === undefined || this.discount_amount === null) {
      this.discount_amount = 0;
    }
    if (this.line_total === undefined || this.line_total === null) {
      this.line_total = 0;
    }
    if (!this.created_at) {
      this.created_at = new Date();
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['quotation_id', 'description'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        quotation_id: { type: ['integer', 'string'] },
        product_id: { type: ['integer', 'string', 'null'] },
        description: { type: 'string', minLength: 1, maxLength: 500 },
        quantity: { type: ['number', 'string'], default: 1 },
        unit_price: { type: ['number', 'string'], minimum: 0, default: 0 },
        customization_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        discount_amount: { type: ['number', 'string'], minimum: 0, default: 0 },
        line_total: { type: ['number', 'string'], minimum: 0, default: 0 },
        metadata: { type: ['object', 'array', 'string', 'null'] },
        created_at: { type: ['string', 'object'] },
      },
    };
  }

  static get relationMappings() {
    const Quotation = require('./Quotation');
    const Product = require('./Product');

    return {
      quotation: {
        relation: Model.BelongsToOneRelation,
        modelClass: Quotation,
        join: {
          from: 'quotation_items.quotation_id',
          to: 'quotations.id',
        },
      },
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'quotation_items.product_id',
          to: 'products.id',
        },
      },
    };
  }
}

module.exports = QuotationItem;
