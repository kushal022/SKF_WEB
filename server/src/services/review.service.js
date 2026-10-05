const ApiError = require('../utils/ApiError');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_REVIEW_STATUSES = ['pending', 'approved', 'rejected'];

const sanitizeReview = (review, isAdmin = false) => {
  if (!review) return null;

  const base = {
    public_id: review.public_id,
    customer_name: review.customer_name,
    rating: review.rating,
    review_text: review.review_text,
    is_featured: Boolean(review.is_featured),
    product: review.product
      ? {
          public_id: review.product.public_id,
          name: review.product.name,
          slug: review.product.slug,
        }
      : null,
    created_at: review.created_at,
    updated_at: review.updated_at,
  };

  if (isAdmin) {
    base.status = review.status;
  }

  return base;
};

/**
 * Public Reviews List (approved only)
 */
const getPublicReviews = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Review.query()
    .where('status', 'approved')
    .withGraphFetched('product')
    .modifiers({
      selectProduct(b) {
        b.select('id', 'public_id', 'name', 'slug');
      },
    });

  if (query.product_id || query.product_public_id) {
    const pid = query.product_id || query.product_public_id;
    const prod = await Product.query().where({ public_id: pid }).first();
    builder = builder.where('product_id', prod ? prod.id : 0);
  }

  if (query.rating) {
    builder = builder.where('rating', Number(query.rating));
  }

  if (query.featured !== undefined) {
    const isFeatured = query.featured === 'true' || query.featured === true;
    builder = builder.where('is_featured', isFeatured);
  }

  builder = builder.orderBy('created_at', 'desc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((r) => sanitizeReview(r, false)),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Public Review Submission (initial status: pending)
 */
const createPublicReview = async (data) => {
  let product_id = null;
  const productIdentifier = data.product_id || data.product_public_id;

  if (productIdentifier) {
    const product = await Product.query()
      .where({ public_id: productIdentifier, status: 'published' })
      .first();

    if (!product) {
      throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }
    product_id = product.id;
  }

  const newReview = await Review.query().insertAndFetch({
    customer_name: data.customer_name,
    rating: data.rating,
    review_text: data.review_text,
    product_id,
    is_featured: false,
    status: 'pending',
  });

  try {
    const notificationService = require('./notification.service');
    await notificationService.createForAdmins({
      type: 'review',
      title: 'New Customer Review Submitted',
      message: `New ${data.rating}-star review from ${data.customer_name} awaiting moderation.`,
      data: {
        customer_name: data.customer_name,
        rating: data.rating,
      },
      related_entity_type: 'Review',
    });
  } catch {
    // Non-blocking notification dispatch
  }

  return {
    public_id: newReview.public_id,
    customer_name: newReview.customer_name,
    rating: newReview.rating,
    status: newReview.status,
    created_at: newReview.created_at,
  };
};

/**
 * Admin Reviews List
 */
const getAdminReviews = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Review.query().withGraphFetched('product');

  if (query.status) {
    builder = builder.where('status', query.status);
  }

  if (query.rating) {
    builder = builder.where('rating', Number(query.rating));
  }

  if (query.is_featured !== undefined) {
    const isFeatured = query.is_featured === 'true' || query.is_featured === true;
    builder = builder.where('is_featured', isFeatured);
  }

  if (query.product_id || query.product_public_id) {
    const pid = query.product_id || query.product_public_id;
    const prod = await Product.query().where({ public_id: pid }).first();
    builder = builder.where('product_id', prod ? prod.id : 0);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('customer_name', 'like', term).orWhere('review_text', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  const allowedSorts = ['created_at', 'updated_at', 'rating', 'status'];
  const finalSortField = allowedSorts.includes(sortField) ? sortField : 'created_at';

  builder = builder.orderBy(finalSortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((r) => sanitizeReview(r, true)),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin Review Detail
 */
const getAdminReviewByPublicId = async (publicId) => {
  const review = await Review.query()
    .where({ public_id: publicId })
    .withGraphFetched('product')
    .first();

  if (!review) {
    throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
  }

  return sanitizeReview(review, true);
};

/**
 * Admin Update Review
 */
const updateAdminReview = async (publicId, data, req) => {
  const review = await Review.query().where({ public_id: publicId }).first();
  if (!review) {
    throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
  }

  const oldValues = sanitizeReview(review, true);
  const updated = await Review.query()
    .patchAndFetchById(review.id, data)
    .withGraphFetched('product');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_REVIEW',
    entityType: 'Review',
    entityId: review.id,
    oldValues,
    newValues: sanitizeReview(updated, true),
  });

  return sanitizeReview(updated, true);
};

/**
 * Admin Review Moderation (status update with transaction)
 */
const updateReviewStatus = async (publicId, { status }, req) => {
  if (!VALID_REVIEW_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid review status', 'INVALID_STATUS');
  }

  return Review.transaction(async (trx) => {
    const review = await Review.query(trx).where({ public_id: publicId }).first();
    if (!review) {
      throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
    }

    const fromStatus = review.status;
    const updated = await Review.query(trx)
      .patchAndFetchById(review.id, { status })
      .withGraphFetched('product');

    await auditService.logRequestAction(
      req,
      {
        action: 'UPDATE_REVIEW_STATUS',
        entityType: 'Review',
        entityId: review.id,
        oldValues: { status: fromStatus },
        newValues: { status },
      },
      trx
    );

    return sanitizeReview(updated, true);
  });
};

/**
 * Admin Toggle/Set Featured Review
 */
const setReviewFeatured = async (publicId, { is_featured }, req) => {
  const review = await Review.query().where({ public_id: publicId }).first();
  if (!review) {
    throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
  }

  const oldValues = sanitizeReview(review, true);
  const updated = await Review.query()
    .patchAndFetchById(review.id, { is_featured })
    .withGraphFetched('product');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_REVIEW',
    entityType: 'Review',
    entityId: review.id,
    oldValues,
    newValues: sanitizeReview(updated, true),
    metadata: { is_featured },
  });

  return sanitizeReview(updated, true);
};

/**
 * Admin Delete Review
 */
const deleteAdminReview = async (publicId, req) => {
  const review = await Review.query().where({ public_id: publicId }).first();
  if (!review) {
    throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
  }

  await Review.query().deleteById(review.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_REVIEW',
    entityType: 'Review',
    entityId: review.id,
    oldValues: sanitizeReview(review, true),
  });

  return { message: 'Review deleted successfully' };
};

module.exports = {
  getPublicReviews,
  createPublicReview,
  getAdminReviews,
  getAdminReviewByPublicId,
  updateAdminReview,
  updateReviewStatus,
  setReviewFeatured,
  deleteAdminReview,
  sanitizeReview,
};
