const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductVideo = require('../models/ProductVideo');
const ProductSpec = require('../models/ProductSpec');
const auditService = require('./audit.service');

const sanitizeImage = (img) => ({
  public_id: img.public_id,
  image_url: img.image_url,
  public_cloudinary_id: img.public_cloudinary_id || null,
  alt_text: img.alt_text || null,
  image_type: img.image_type || null,
  sort_order: img.sort_order,
  is_primary: Boolean(img.is_primary),
  created_at: img.created_at,
  updated_at: img.updated_at,
});

const sanitizeVideo = (vid) => ({
  public_id: vid.public_id,
  video_url: vid.video_url,
  thumbnail_url: vid.thumbnail_url || null,
  title: vid.title || null,
  sort_order: vid.sort_order,
  is_active: Boolean(vid.is_active),
  created_at: vid.created_at,
  updated_at: vid.updated_at,
});

const sanitizeSpec = (spec) => ({
  public_id: spec.public_id,
  spec_name: spec.spec_name,
  spec_value: spec.spec_value,
  sort_order: spec.sort_order,
  created_at: spec.created_at,
  updated_at: spec.updated_at,
});

/**
 * Helper to fetch and verify product by publicId.
 */
const getProductByPublicId = async (productPublicId) => {
  const product = await Product.query().where({ public_id: productPublicId }).first();
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }
  return product;
};

// ==================== PRODUCT IMAGES ====================

const getProductImages = async (productPublicId) => {
  const product = await getProductByPublicId(productPublicId);
  const images = await ProductImage.query()
    .where({ product_id: product.id })
    .orderBy('is_primary', 'desc')
    .orderBy('sort_order', 'asc');
  return images.map(sanitizeImage);
};

const addProductImage = async (productPublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);

  const image = await ProductImage.transaction(async (trx) => {
    if (data.is_primary) {
      await ProductImage.query(trx)
        .where({ product_id: product.id })
        .patch({ is_primary: false });
    }

    return ProductImage.query(trx).insertAndFetch({
      ...data,
      product_id: product.id,
    });
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_PRODUCT_IMAGE',
    entityType: 'ProductImage',
    entityId: image.id,
    newValues: sanitizeImage(image),
  });

  return sanitizeImage(image);
};

const updateProductImage = async (productPublicId, imagePublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);
  const image = await ProductImage.query()
    .where({ public_id: imagePublicId, product_id: product.id })
    .first();

  if (!image) {
    throw new ApiError(404, 'Product image not found for this product', 'IMAGE_NOT_FOUND');
  }

  const updatedImage = await ProductImage.transaction(async (trx) => {
    if (data.is_primary) {
      await ProductImage.query(trx)
        .where({ product_id: product.id })
        .whereNot('id', image.id)
        .patch({ is_primary: false });
    }

    return ProductImage.query(trx).patchAndFetchById(image.id, data);
  });

  await auditService.logRequestAction(req, {
    action: 'UPDATE_PRODUCT_IMAGE',
    entityType: 'ProductImage',
    entityId: image.id,
    oldValues: sanitizeImage(image),
    newValues: sanitizeImage(updatedImage),
  });

  return sanitizeImage(updatedImage);
};

const deleteProductImage = async (productPublicId, imagePublicId, req) => {
  const product = await getProductByPublicId(productPublicId);
  const image = await ProductImage.query()
    .where({ public_id: imagePublicId, product_id: product.id })
    .first();

  if (!image) {
    throw new ApiError(404, 'Product image not found for this product', 'IMAGE_NOT_FOUND');
  }

  await ProductImage.query().deleteById(image.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_PRODUCT_IMAGE',
    entityType: 'ProductImage',
    entityId: image.id,
    oldValues: sanitizeImage(image),
  });

  return true;
};

const setPrimaryProductImage = async (productPublicId, imagePublicId, req) => {
  const product = await getProductByPublicId(productPublicId);
  const image = await ProductImage.query()
    .where({ public_id: imagePublicId, product_id: product.id })
    .first();

  if (!image) {
    throw new ApiError(404, 'Product image not found for this product', 'IMAGE_NOT_FOUND');
  }

  const updatedImage = await ProductImage.transaction(async (trx) => {
    await ProductImage.query(trx)
      .where({ product_id: product.id })
      .patch({ is_primary: false });

    return ProductImage.query(trx).patchAndFetchById(image.id, { is_primary: true });
  });

  await auditService.logRequestAction(req, {
    action: 'SET_PRIMARY_PRODUCT_IMAGE',
    entityType: 'ProductImage',
    entityId: image.id,
    metadata: { product_public_id: productPublicId, image_public_id: imagePublicId },
  });

  return sanitizeImage(updatedImage);
};

const reorderProductImages = async (productPublicId, items, req) => {
  const product = await getProductByPublicId(productPublicId);

  await ProductImage.transaction(async (trx) => {
    for (const item of items) {
      const img = await ProductImage.query(trx)
        .where({ public_id: item.public_id, product_id: product.id })
        .first();

      if (!img) {
        throw new ApiError(
          400,
          `Image with public ID ${item.public_id} does not belong to this product`,
          'INVALID_IMAGE_REFERENCE'
        );
      }

      await ProductImage.query(trx).patchAndFetchById(img.id, {
        sort_order: item.sort_order,
      });
    }
  });

  await auditService.logRequestAction(req, {
    action: 'REORDER_PRODUCT_IMAGES',
    entityType: 'Product',
    entityId: product.id,
    metadata: { items_reordered: items.length },
  });

  return getProductImages(productPublicId);
};

// ==================== PRODUCT VIDEOS ====================

const getProductVideos = async (productPublicId) => {
  const product = await getProductByPublicId(productPublicId);
  const videos = await ProductVideo.query()
    .where({ product_id: product.id })
    .orderBy('sort_order', 'asc');
  return videos.map(sanitizeVideo);
};

const addProductVideo = async (productPublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);
  const video = await ProductVideo.query().insertAndFetch({
    ...data,
    product_id: product.id,
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_PRODUCT_VIDEO',
    entityType: 'ProductVideo',
    entityId: video.id,
    newValues: sanitizeVideo(video),
  });

  return sanitizeVideo(video);
};

const updateProductVideo = async (productPublicId, videoPublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);
  const video = await ProductVideo.query()
    .where({ public_id: videoPublicId, product_id: product.id })
    .first();

  if (!video) {
    throw new ApiError(404, 'Product video not found for this product', 'VIDEO_NOT_FOUND');
  }

  const updatedVideo = await ProductVideo.query().patchAndFetchById(video.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_PRODUCT_VIDEO',
    entityType: 'ProductVideo',
    entityId: video.id,
    oldValues: sanitizeVideo(video),
    newValues: sanitizeVideo(updatedVideo),
  });

  return sanitizeVideo(updatedVideo);
};

const deleteProductVideo = async (productPublicId, videoPublicId, req) => {
  const product = await getProductByPublicId(productPublicId);
  const video = await ProductVideo.query()
    .where({ public_id: videoPublicId, product_id: product.id })
    .first();

  if (!video) {
    throw new ApiError(404, 'Product video not found for this product', 'VIDEO_NOT_FOUND');
  }

  await ProductVideo.query().deleteById(video.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_PRODUCT_VIDEO',
    entityType: 'ProductVideo',
    entityId: video.id,
    oldValues: sanitizeVideo(video),
  });

  return true;
};

// ==================== PRODUCT SPECS ====================

const getProductSpecs = async (productPublicId) => {
  const product = await getProductByPublicId(productPublicId);
  const specs = await ProductSpec.query()
    .where({ product_id: product.id })
    .orderBy('sort_order', 'asc');
  return specs.map(sanitizeSpec);
};

const addProductSpec = async (productPublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);
  const spec = await ProductSpec.query().insertAndFetch({
    ...data,
    product_id: product.id,
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_PRODUCT_SPEC',
    entityType: 'ProductSpec',
    entityId: spec.id,
    newValues: sanitizeSpec(spec),
  });

  return sanitizeSpec(spec);
};

const updateProductSpec = async (productPublicId, specPublicId, data, req) => {
  const product = await getProductByPublicId(productPublicId);
  const spec = await ProductSpec.query()
    .where({ public_id: specPublicId, product_id: product.id })
    .first();

  if (!spec) {
    throw new ApiError(404, 'Product specification not found for this product', 'SPEC_NOT_FOUND');
  }

  const updatedSpec = await ProductSpec.query().patchAndFetchById(spec.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_PRODUCT_SPEC',
    entityType: 'ProductSpec',
    entityId: spec.id,
    oldValues: sanitizeSpec(spec),
    newValues: sanitizeSpec(updatedSpec),
  });

  return sanitizeSpec(updatedSpec);
};

const deleteProductSpec = async (productPublicId, specPublicId, req) => {
  const product = await getProductByPublicId(productPublicId);
  const spec = await ProductSpec.query()
    .where({ public_id: specPublicId, product_id: product.id })
    .first();

  if (!spec) {
    throw new ApiError(404, 'Product specification not found for this product', 'SPEC_NOT_FOUND');
  }

  await ProductSpec.query().deleteById(spec.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_PRODUCT_SPEC',
    entityType: 'ProductSpec',
    entityId: spec.id,
    oldValues: sanitizeSpec(spec),
  });

  return true;
};

module.exports = {
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
  getProductVideos,
  addProductVideo,
  updateProductVideo,
  deleteProductVideo,
  getProductSpecs,
  addProductSpec,
  updateProductSpec,
  deleteProductSpec,
};
