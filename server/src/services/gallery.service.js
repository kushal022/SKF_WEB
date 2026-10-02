const ApiError = require('../utils/ApiError');
const Gallery = require('../models/Gallery');
const GalleryImage = require('../models/GalleryImage');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const sanitizeGalleryImage = (img) => {
  if (!img) return null;
  return {
    public_id: img.public_id,
    image_url: img.image_url,
    cloudinary_public_id: img.cloudinary_public_id || null,
    alt_text: img.alt_text || null,
    sort_order: img.sort_order,
    created_at: img.created_at,
  };
};

const sanitizeGallery = (gallery) => {
  if (!gallery) return null;
  return {
    public_id: gallery.public_id,
    title: gallery.title,
    slug: gallery.slug,
    category: gallery.category || null,
    description: gallery.description || null,
    status: gallery.status,
    images: Array.isArray(gallery.galleryImages)
      ? gallery.galleryImages.map(sanitizeGalleryImage)
      : undefined,
    created_at: gallery.created_at,
    updated_at: gallery.updated_at,
  };
};

/**
 * Public Galleries List (published only)
 */
const getPublicGalleries = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Gallery.query()
    .where('status', 'published')
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'));

  if (query.category) {
    builder = builder.where('category', query.category);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('title', 'like', term).orWhere('description', 'like', term);
    });
  }

  builder = builder.orderBy('created_at', 'desc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map(sanitizeGallery),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Public Gallery Detail (published only)
 */
const getPublicGalleryByPublicId = async (publicId) => {
  const gallery = await Gallery.query()
    .where({ public_id: publicId, status: 'published' })
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'))
    .first();

  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  return sanitizeGallery(gallery);
};

/**
 * Admin Galleries List
 */
const getAdminGalleries = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Gallery.query()
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'));

  if (query.status) {
    builder = builder.where('status', query.status);
  }

  if (query.category) {
    builder = builder.where('category', query.category);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('title', 'like', term)
        .orWhere('description', 'like', term)
        .orWhere('slug', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  const allowedSorts = ['created_at', 'updated_at', 'title', 'status'];
  const finalSortField = allowedSorts.includes(sortField) ? sortField : 'created_at';

  builder = builder.orderBy(finalSortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map(sanitizeGallery),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin Gallery Detail
 */
const getAdminGalleryByPublicId = async (publicId) => {
  const gallery = await Gallery.query()
    .where({ public_id: publicId })
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'))
    .first();

  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  return sanitizeGallery(gallery);
};

/**
 * Admin Create Gallery
 */
const createAdminGallery = async (data, req) => {
  const existing = await Gallery.query().where({ slug: data.slug }).first();
  if (existing) {
    throw new ApiError(409, 'Gallery with this slug already exists', 'DUPLICATE_SLUG');
  }

  const newGallery = await Gallery.query().insertAndFetch({
    title: data.title,
    slug: data.slug,
    category: data.category || null,
    description: data.description || null,
    status: data.status || 'draft',
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_GALLERY',
    entityType: 'Gallery',
    entityId: newGallery.id,
    newValues: sanitizeGallery(newGallery),
  });

  return sanitizeGallery(newGallery);
};

/**
 * Admin Update Gallery
 */
const updateAdminGallery = async (publicId, data, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  if (data.slug && data.slug !== gallery.slug) {
    const existing = await Gallery.query()
      .where({ slug: data.slug })
      .whereNot('id', gallery.id)
      .first();
    if (existing) {
      throw new ApiError(409, 'Gallery with this slug already exists', 'DUPLICATE_SLUG');
    }
  }

  const oldValues = sanitizeGallery(gallery);
  const updated = await Gallery.query()
    .patchAndFetchById(gallery.id, data)
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'));

  await auditService.logRequestAction(req, {
    action: 'UPDATE_GALLERY',
    entityType: 'Gallery',
    entityId: gallery.id,
    oldValues,
    newValues: sanitizeGallery(updated),
  });

  return sanitizeGallery(updated);
};

/**
 * Admin Delete Gallery
 */
const deleteAdminGallery = async (publicId, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  await Gallery.query().deleteById(gallery.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_GALLERY',
    entityType: 'Gallery',
    entityId: gallery.id,
    oldValues: sanitizeGallery(gallery),
  });

  return { message: 'Gallery deleted successfully' };
};

/**
 * Admin Publish Gallery
 */
const publishAdminGallery = async (publicId, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  const oldValues = sanitizeGallery(gallery);
  const updated = await Gallery.query()
    .patchAndFetchById(gallery.id, { status: 'published' })
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'));

  await auditService.logRequestAction(req, {
    action: 'PUBLISH_GALLERY',
    entityType: 'Gallery',
    entityId: gallery.id,
    oldValues,
    newValues: sanitizeGallery(updated),
  });

  return sanitizeGallery(updated);
};

/**
 * Admin Archive Gallery
 */
const archiveAdminGallery = async (publicId, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  const oldValues = sanitizeGallery(gallery);
  const updated = await Gallery.query()
    .patchAndFetchById(gallery.id, { status: 'archived' })
    .withGraphFetched('galleryImages')
    .modifyGraph('galleryImages', (b) => b.orderBy('sort_order', 'asc'));

  await auditService.logRequestAction(req, {
    action: 'ARCHIVE_GALLERY',
    entityType: 'Gallery',
    entityId: gallery.id,
    oldValues,
    newValues: sanitizeGallery(updated),
  });

  return sanitizeGallery(updated);
};

/**
 * Admin Gallery Images CRUD
 */
const getGalleryImages = async (publicId) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  const images = await GalleryImage.query()
    .where({ gallery_id: gallery.id })
    .orderBy('sort_order', 'asc');

  return images.map(sanitizeGalleryImage);
};

const addGalleryImage = async (publicId, data, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  let sortOrder = data.sort_order;
  if (sortOrder === undefined || sortOrder === null) {
    const maxSort = await GalleryImage.query()
      .where({ gallery_id: gallery.id })
      .max('sort_order as maxSort')
      .first();
    sortOrder = maxSort?.maxSort !== null ? Number(maxSort.maxSort) + 1 : 0;
  }

  const created = await GalleryImage.query().insertAndFetch({
    gallery_id: gallery.id,
    image_url: data.image_url,
    cloudinary_public_id: data.cloudinary_public_id || null,
    alt_text: data.alt_text || null,
    sort_order: sortOrder,
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_GALLERY_IMAGE',
    entityType: 'GalleryImage',
    entityId: created.id,
    newValues: sanitizeGalleryImage(created),
  });

  return sanitizeGalleryImage(created);
};

const updateGalleryImage = async (publicId, imagePublicId, data, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  const existing = await GalleryImage.query()
    .where({ public_id: imagePublicId, gallery_id: gallery.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Gallery image not found', 'IMAGE_NOT_FOUND');
  }

  const oldValues = sanitizeGalleryImage(existing);
  const updated = await GalleryImage.query().patchAndFetchById(existing.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_GALLERY_IMAGE',
    entityType: 'GalleryImage',
    entityId: existing.id,
    oldValues,
    newValues: sanitizeGalleryImage(updated),
  });

  return sanitizeGalleryImage(updated);
};

const deleteGalleryImage = async (publicId, imagePublicId, req) => {
  const gallery = await Gallery.query().where({ public_id: publicId }).first();
  if (!gallery) {
    throw new ApiError(404, 'Gallery not found', 'GALLERY_NOT_FOUND');
  }

  const existing = await GalleryImage.query()
    .where({ public_id: imagePublicId, gallery_id: gallery.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Gallery image not found', 'IMAGE_NOT_FOUND');
  }

  await GalleryImage.query().deleteById(existing.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_GALLERY_IMAGE',
    entityType: 'GalleryImage',
    entityId: existing.id,
    oldValues: sanitizeGalleryImage(existing),
  });

  return { message: 'Gallery image deleted successfully' };
};

module.exports = {
  getPublicGalleries,
  getPublicGalleryByPublicId,
  getAdminGalleries,
  getAdminGalleryByPublicId,
  createAdminGallery,
  updateAdminGallery,
  deleteAdminGallery,
  publishAdminGallery,
  archiveAdminGallery,
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  sanitizeGallery,
};
