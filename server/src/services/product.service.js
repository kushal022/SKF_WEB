const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

/**
 * Format raw Product model instance into safe API representation.
 */
const sanitizeProduct = (product, includeDetails = false) => {
  if (!product) return null;

  const result = {
    public_id: product.public_id,
    name: product.name,
    slug: product.slug,
    product_code: product.product_code,
    short_description: product.short_description || null,
    material: product.material || null,
    finish: product.finish || null,
    color: product.color || null,
    features: product.features || null,
    sizes: product.sizes || null,
    customizable: Boolean(product.customizable),
    featured: Boolean(product.featured),
    status: product.status,
    category: product.category
      ? {
          public_id: product.category.public_id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    primary_image: Array.isArray(product.images) && product.images.length > 0
      ? (() => {
          const primary = product.images.find((img) => img.is_primary) || product.images[0];
          return {
            public_id: primary.public_id,
            image_url: primary.image_url,
            alt_text: primary.alt_text || null,
          };
        })()
      : null,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };

  if (includeDetails) {
    result.description = product.description || null;
    result.meta_data = product.meta_data || null;
    result.seo_title = product.seo_title || null;
    result.seo_description = product.seo_description || null;
    result.model_3d_url = product.model_3d_url || null;
    result.ar_enabled = Boolean(product.ar_enabled);

    result.images = Array.isArray(product.images)
      ? product.images.map((img) => ({
          public_id: img.public_id,
          image_url: img.image_url,
          alt_text: img.alt_text || null,
          image_type: img.image_type || null,
          sort_order: img.sort_order,
          is_primary: Boolean(img.is_primary),
        }))
      : [];

    result.videos = Array.isArray(product.videos)
      ? product.videos.map((vid) => ({
          public_id: vid.public_id,
          video_url: vid.video_url,
          thumbnail_url: vid.thumbnail_url || null,
          title: vid.title || null,
          sort_order: vid.sort_order,
          is_active: Boolean(vid.is_active),
        }))
      : [];

    result.specs = Array.isArray(product.specs)
      ? product.specs.map((sp) => ({
          public_id: sp.public_id,
          spec_name: sp.spec_name,
          spec_value: sp.spec_value,
          sort_order: sp.sort_order,
        }))
      : [];
  }

  return result;
};

/**
 * Public: list published products only.
 */
const getPublicProducts = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Product.query()
    .where('status', 'published')
    .withGraphFetched('[category(selectBasic), images(orderImages)]')
    .modifiers({
      selectBasic(b) {
        b.select('id', 'public_id', 'name', 'slug');
      },
      orderImages(b) {
        b.orderBy('is_primary', 'desc').orderBy('sort_order', 'asc');
      },
    });

  // Filter by category
  if (query.category_public_id) {
    const category = await Category.query().where({ public_id: query.category_public_id }).first();
    builder = builder.where('category_id', category ? category.id : 0);
  } else if (query.category_slug) {
    const category = await Category.query().where({ slug: query.category_slug }).first();
    builder = builder.where('category_id', category ? category.id : 0);
  }

  // Filter by flags
  if (query.featured !== undefined) {
    builder = builder.where('featured', query.featured);
  }
  if (query.customizable !== undefined) {
    builder = builder.where('customizable', query.customizable);
  }

  // Search
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('name', 'like', term)
        .orWhere('slug', 'like', term)
        .orWhere('product_code', 'like', term)
        .orWhere('short_description', 'like', term)
        .orWhere('material', 'like', term)
        .orWhere('finish', 'like', term);
    });
  }

  // Sorting
  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  builder = builder.orderBy(sortField, isDesc ? 'desc' : 'asc');

  const [total, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((p) => sanitizeProduct(p, false)),
    total,
    page,
    limit,
  });
};

/**
 * Public: product details for published product only.
 */
const getPublicProductByPublicId = async (publicId) => {
  const product = await Product.query()
    .where({ public_id: publicId, status: 'published' })
    .withGraphFetched('[category(selectBasic), images(orderImages), videos(activeVideos), specs(orderSpecs)]')
    .modifiers({
      selectBasic(b) {
        b.select('id', 'public_id', 'name', 'slug');
      },
      orderImages(b) {
        b.orderBy('is_primary', 'desc').orderBy('sort_order', 'asc');
      },
      activeVideos(b) {
        b.where('is_active', true).orderBy('sort_order', 'asc');
      },
      orderSpecs(b) {
        b.orderBy('sort_order', 'asc');
      },
    })
    .first();

  if (!product) {
    throw new ApiError(404, 'Product not found or not published', 'PRODUCT_NOT_FOUND');
  }

  return sanitizeProduct(product, true);
};

/**
 * Admin: list products across all statuses.
 */
const getAdminProducts = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Product.query()
    .withGraphFetched('[category, images(orderImages)]')
    .modifiers({
      orderImages(b) {
        b.orderBy('is_primary', 'desc').orderBy('sort_order', 'asc');
      },
    });

  if (query.status) {
    builder = builder.where('status', query.status);
  }

  if (query.category_public_id) {
    const category = await Category.query().where({ public_id: query.category_public_id }).first();
    builder = builder.where('category_id', category ? category.id : 0);
  }

  if (query.featured !== undefined) {
    builder = builder.where('featured', query.featured);
  }
  if (query.customizable !== undefined) {
    builder = builder.where('customizable', query.customizable);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('name', 'like', term)
        .orWhere('slug', 'like', term)
        .orWhere('product_code', 'like', term)
        .orWhere('material', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  builder = builder.orderBy(sortField, isDesc ? 'desc' : 'asc');

  const [total, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((p) => sanitizeProduct(p, false)),
    total,
    page,
    limit,
  });
};

/**
 * Admin: full product details.
 */
const getAdminProductByPublicId = async (publicId) => {
  const product = await Product.query()
    .where({ public_id: publicId })
    .withGraphFetched('[category, images(orderImages), videos(orderVideos), specs(orderSpecs)]')
    .modifiers({
      orderImages(b) {
        b.orderBy('is_primary', 'desc').orderBy('sort_order', 'asc');
      },
      orderVideos(b) {
        b.orderBy('sort_order', 'asc');
      },
      orderSpecs(b) {
        b.orderBy('sort_order', 'asc');
      },
    })
    .first();

  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  return sanitizeProduct(product, true);
};

/**
 * Admin: create product.
 */
const createProduct = async (data, req) => {
  // 1. Resolve category
  const category = await Category.query().where({ public_id: data.category_public_id }).first();
  if (!category) {
    throw new ApiError(404, 'Category referenced by category_public_id does not exist', 'CATEGORY_NOT_FOUND');
  }

  // 2. Check slug uniqueness
  const slugExists = await Product.query().where({ slug: data.slug }).first();
  if (slugExists) {
    throw new ApiError(409, 'Product slug already exists', 'DUPLICATE_SLUG');
  }

  // 3. Check product_code uniqueness
  const codeExists = await Product.query().where({ product_code: data.product_code }).first();
  if (codeExists) {
    throw new ApiError(409, 'Product code already exists', 'DUPLICATE_PRODUCT_CODE');
  }

  const { category_public_id, ...productData } = data;

  const product = await Product.query()
    .insertAndFetch({
      ...productData,
      category_id: category.id,
      status: data.status || 'draft',
    })
    .withGraphFetched('category');

  await auditService.logRequestAction(req, {
    action: 'CREATE_PRODUCT',
    entityType: 'Product',
    entityId: product.id,
    newValues: sanitizeProduct(product, true),
  });

  return sanitizeProduct(product, true);
};

/**
 * Admin: update product.
 */
const updateProduct = async (publicId, data, req) => {
  const product = await Product.query().where({ public_id: publicId }).first();
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  const patchPayload = { ...data };

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== product.slug) {
    const slugExists = await Product.query()
      .where({ slug: data.slug })
      .whereNot('id', product.id)
      .first();
    if (slugExists) {
      throw new ApiError(409, 'Product slug already exists', 'DUPLICATE_SLUG');
    }
  }

  // Check product_code uniqueness if changing
  if (data.product_code && data.product_code !== product.product_code) {
    const codeExists = await Product.query()
      .where({ product_code: data.product_code })
      .whereNot('id', product.id)
      .first();
    if (codeExists) {
      throw new ApiError(409, 'Product code already exists', 'DUPLICATE_PRODUCT_CODE');
    }
  }

  // Resolve category if updating
  if (data.category_public_id) {
    delete patchPayload.category_public_id;
    const category = await Category.query().where({ public_id: data.category_public_id }).first();
    if (!category) {
      throw new ApiError(404, 'Category referenced by category_public_id does not exist', 'CATEGORY_NOT_FOUND');
    }
    patchPayload.category_id = category.id;
  }

  const oldValues = sanitizeProduct(product, true);

  const updated = await Product.query()
    .patchAndFetchById(product.id, patchPayload)
    .withGraphFetched('[category, images, videos, specs]');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: updated.id,
    oldValues,
    newValues: sanitizeProduct(updated, true),
  });

  return sanitizeProduct(updated, true);
};

/**
 * Admin: delete product.
 */
const deleteProduct = async (publicId, req) => {
  const product = await Product.query().where({ public_id: publicId }).first();
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  const oldValues = sanitizeProduct(product, false);

  // CASCADE will handle product_images, product_videos, product_specs
  await Product.query().deleteById(product.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_PRODUCT',
    entityType: 'Product',
    entityId: product.id,
    oldValues,
  });

  return true;
};

/**
 * Admin: publish product.
 */
const publishProduct = async (publicId, req) => {
  return updateProduct(publicId, { status: 'published' }, req);
};

/**
 * Admin: archive product.
 */
const archiveProduct = async (publicId, req) => {
  return updateProduct(publicId, { status: 'archived' }, req);
};

module.exports = {
  getPublicProducts,
  getPublicProductByPublicId,
  getAdminProducts,
  getAdminProductByPublicId,
  createProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  archiveProduct,
};
