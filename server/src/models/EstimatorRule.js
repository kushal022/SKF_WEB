const crypto = require('crypto');
const { Model } = require('../db');

class EstimatorRule extends Model {
  static get tableName() {
    return 'estimator_rules';
  }

  static get jsonAttributes() {
    return ['rule_config'];
  }

  $beforeInsert() {
    if (!this.public_id) {
      this.public_id = crypto.randomUUID();
    }
    if (this.priority === undefined || this.priority === null) {
      this.priority = 0;
    }
    if (this.is_active === undefined || this.is_active === null) {
      this.is_active = true;
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
      required: ['name'],
      properties: {
        id: { type: ['integer', 'string'] },
        public_id: { type: 'string', minLength: 36, maxLength: 36 },
        name: { type: 'string', minLength: 1, maxLength: 150 },
        product_type: { type: ['string', 'null'], maxLength: 150 },
        material: { type: ['string', 'null'], maxLength: 150 },
        finish: { type: ['string', 'null'], maxLength: 150 },
        dimension_multiplier: { type: ['number', 'string', 'null'] },
        material_rate: { type: ['number', 'string', 'null'] },
        finish_adjustment: { type: ['number', 'string', 'null'] },
        base_rate: { type: ['number', 'string', 'null'] },
        rule_config: { type: ['object', 'array', 'string', 'null'] },
        priority: { type: 'integer', default: 0 },
        is_active: { type: ['boolean', 'integer'], default: true },
        created_at: { type: ['string', 'object'] },
        updated_at: { type: ['string', 'object'] },
      },
    };
  }
}

module.exports = EstimatorRule;
