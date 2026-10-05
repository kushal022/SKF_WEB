const ApiError = require('../utils/ApiError');
const CustomRequest = require('../models/CustomRequest');
const CustomRequestImage = require('../models/CustomRequestImage');
const Enquiry = require('../models/Enquiry');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_CUSTOM_REQUEST_TRANSITIONS = {
  new: ['reviewing', 'rejected'],
  reviewing: ['quoted', 'rejected'],
  quoted: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: ['reviewing', 'new'],
  completed: [],
};

const sanitizeCustomRequestImage = (img) => {
  if (!img) return null;
  return {
    public_id: img.public_id,
    image_url: img.image_url,
    cloudinary_public_id: img.cloudinary_public_id || null,
    sort_order: img.sort_order,
    created_at: img.created_at,
  };
};

const sanitizeCustomRequest = (reqObj, isAdmin = false) => {
  if (!reqObj) return null;

  const base = {
    public_id: reqObj.public_id,
    product_type: reqObj.product_type,
    width: reqObj.width !== null ? Number(reqObj.width) : null,
    length: reqObj.length !== null ? Number(reqObj.length) : null,
    height: reqObj.height !== null ? Number(reqObj.height) : null,
    dimension_unit: reqObj.dimension_unit || null,
    material: reqObj.material || null,
    finish: reqObj.finish || null,
    quantity: reqObj.quantity,
    customer_name: reqObj.customer_name,
    phone: reqObj.phone,
    email: reqObj.email || null,
    city: reqObj.city || null,
    requirement: reqObj.requirement || null,
    estimated_amount: reqObj.estimated_amount !== null ? Number(reqObj.estimated_amount) : null,
    status: reqObj.status,
    images: Array.isArray(reqObj.images) ? reqObj.images.map(sanitizeCustomRequestImage) : [],
    created_at: reqObj.created_at,
    updated_at: reqObj.updated_at,
  };

  if (isAdmin && Array.isArray(reqObj.enquiries)) {
    base.linked_enquiries = reqObj.enquiries.map((enq) => ({
      public_id: enq.public_id,
      status: enq.status,
      source: enq.source,
      created_at: enq.created_at,
    }));
  }

  return base;
};

/**
 * Public submit custom furniture request.
 * Transactionally creates custom_request + optional custom_request_images + linked enquiry.
 */
const createPublicCustomRequest = async (data) => {
  const result = await CustomRequest.transaction(async (trx) => {
    const { images, ...requestData } = data;

    const newRequest = await CustomRequest.query(trx).insertAndFetch({
      product_type: requestData.product_type,
      width: requestData.width !== undefined && requestData.width !== null ? requestData.width : null,
      length: requestData.length !== undefined && requestData.length !== null ? requestData.length : null,
      height: requestData.height !== undefined && requestData.height !== null ? requestData.height : null,
      dimension_unit: requestData.dimension_unit || 'mm',
      material: requestData.material || null,
      finish: requestData.finish || null,
      quantity: requestData.quantity || 1,
      customer_name: requestData.customer_name,
      phone: requestData.phone,
      email: requestData.email || null,
      city: requestData.city || null,
      requirement: requestData.requirement || null,
      estimated_amount:
        requestData.estimated_amount !== undefined && requestData.estimated_amount !== null
          ? requestData.estimated_amount
          : null,
      status: 'new',
    });

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await CustomRequestImage.query(trx).insert({
          custom_request_id: newRequest.id,
          image_url: images[i].image_url,
          cloudinary_public_id: images[i].cloudinary_public_id || null,
          sort_order: images[i].sort_order !== undefined ? images[i].sort_order : i,
        });
      }
    }

    // Step 9.9: Connect custom request to an enquiry
    await Enquiry.query(trx).insert({
      customer_name: newRequest.customer_name,
      phone: newRequest.phone,
      email: newRequest.email,
      custom_request_id: newRequest.id,
      source: 'custom_request',
      message: newRequest.requirement || `Custom request for ${newRequest.product_type}`,
      status: 'new',
    });

    return {
      public_id: newRequest.public_id,
      product_type: newRequest.product_type,
      customer_name: newRequest.customer_name,
      phone: newRequest.phone,
      status: newRequest.status,
      created_at: newRequest.created_at,
    };
  });

  try {
    const notificationService = require('./notification.service');
    await notificationService.createForAdmins({
      type: 'custom_request',
      title: 'New Custom Furniture Request',
      message: `Custom request for ${result.product_type} from ${result.customer_name}`,
      data: {
        custom_request_public_id: result.public_id,
        customer_name: result.customer_name,
        product_type: result.product_type,
      },
      related_entity_type: 'CustomRequest',
    });
  } catch {
    // Non-blocking notification dispatch
  }

  return result;
};

/**
 * Admin list custom requests.
 */
const getAdminCustomRequests = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = CustomRequest.query().withGraphFetched('images');

  if (query.status) {
    builder = builder.where('status', query.status);
  }

  if (query.product_type) {
    builder = builder.where('product_type', query.product_type);
  }

  if (query.city) {
    builder = builder.where('city', query.city);
  }

  if (query.from_date) {
    builder = builder.where('created_at', '>=', query.from_date);
  }

  if (query.to_date) {
    builder = builder.where('created_at', '<=', query.to_date);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('customer_name', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('email', 'like', term)
        .orWhere('city', 'like', term)
        .orWhere('requirement', 'like', term)
        .orWhere('product_type', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  const allowedSorts = ['created_at', 'updated_at', 'customer_name', 'status', 'quantity'];
  const finalSortField = allowedSorts.includes(sortField) ? sortField : 'created_at';

  builder = builder.orderBy(finalSortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((item) => sanitizeCustomRequest(item, false)),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin get custom request detail.
 */
const getAdminCustomRequestByPublicId = async (publicId) => {
  const request = await CustomRequest.query()
    .where({ public_id: publicId })
    .withGraphFetched('[images, enquiries]')
    .modifyGraph('images', (b) => b.orderBy('sort_order', 'asc'))
    .first();

  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  return sanitizeCustomRequest(request, true);
};

/**
 * Admin update custom request fields.
 */
const updateAdminCustomRequest = async (publicId, data, req) => {
  const request = await CustomRequest.query().where({ public_id: publicId }).first();
  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  const oldValues = sanitizeCustomRequest(request, false);
  const updated = await CustomRequest.query()
    .patchAndFetchById(request.id, data)
    .withGraphFetched('images');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_CUSTOM_REQUEST',
    entityType: 'CustomRequest',
    entityId: request.id,
    oldValues,
    newValues: sanitizeCustomRequest(updated, false),
  });

  return sanitizeCustomRequest(updated, true);
};

/**
 * Admin update custom request status.
 */
const updateCustomRequestStatus = async (publicId, { status }, req) => {
  return CustomRequest.transaction(async (trx) => {
    const request = await CustomRequest.query(trx).where({ public_id: publicId }).first();
    if (!request) {
      throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
    }

    if (request.status !== status) {
      const allowed = VALID_CUSTOM_REQUEST_TRANSITIONS[request.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(
          400,
          `Cannot transition custom request status from '${request.status}' to '${status}'`,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }

    const fromStatus = request.status;
    const updated = await CustomRequest.query(trx)
      .patchAndFetchById(request.id, { status })
      .withGraphFetched('images');

    await auditService.logRequestAction(
      req,
      {
        action: 'UPDATE_CUSTOM_REQUEST_STATUS',
        entityType: 'CustomRequest',
        entityId: request.id,
        oldValues: { status: fromStatus },
        newValues: { status },
      },
      trx
    );

    return sanitizeCustomRequest(updated, true);
  });
};

/**
 * Custom Request Images CRUD
 */
const getCustomRequestImages = async (publicId) => {
  const request = await CustomRequest.query().where({ public_id: publicId }).first();
  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  const images = await CustomRequestImage.query()
    .where({ custom_request_id: request.id })
    .orderBy('sort_order', 'asc');

  return images.map(sanitizeCustomRequestImage);
};

const addCustomRequestImage = async (publicId, data, req) => {
  const request = await CustomRequest.query().where({ public_id: publicId }).first();
  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  let sortOrder = data.sort_order;
  if (sortOrder === undefined || sortOrder === null) {
    const maxSort = await CustomRequestImage.query()
      .where({ custom_request_id: request.id })
      .max('sort_order as maxSort')
      .first();
    sortOrder = maxSort?.maxSort !== null ? Number(maxSort.maxSort) + 1 : 0;
  }

  const created = await CustomRequestImage.query().insertAndFetch({
    custom_request_id: request.id,
    image_url: data.image_url,
    cloudinary_public_id: data.cloudinary_public_id || null,
    sort_order: sortOrder,
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_CUSTOM_REQUEST_IMAGE',
    entityType: 'CustomRequestImage',
    entityId: created.id,
    newValues: sanitizeCustomRequestImage(created),
  });

  return sanitizeCustomRequestImage(created);
};

const updateCustomRequestImage = async (publicId, imagePublicId, data, req) => {
  const request = await CustomRequest.query().where({ public_id: publicId }).first();
  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  const existing = await CustomRequestImage.query()
    .where({ public_id: imagePublicId, custom_request_id: request.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Custom request image not found', 'IMAGE_NOT_FOUND');
  }

  const oldValues = sanitizeCustomRequestImage(existing);
  const updated = await CustomRequestImage.query().patchAndFetchById(existing.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_CUSTOM_REQUEST_IMAGE',
    entityType: 'CustomRequestImage',
    entityId: existing.id,
    oldValues,
    newValues: sanitizeCustomRequestImage(updated),
  });

  return sanitizeCustomRequestImage(updated);
};

const deleteCustomRequestImage = async (publicId, imagePublicId, req) => {
  const request = await CustomRequest.query().where({ public_id: publicId }).first();
  if (!request) {
    throw new ApiError(404, 'Custom request not found', 'CUSTOM_REQUEST_NOT_FOUND');
  }

  const existing = await CustomRequestImage.query()
    .where({ public_id: imagePublicId, custom_request_id: request.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Custom request image not found', 'IMAGE_NOT_FOUND');
  }

  await CustomRequestImage.query().deleteById(existing.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_CUSTOM_REQUEST_IMAGE',
    entityType: 'CustomRequestImage',
    entityId: existing.id,
    oldValues: sanitizeCustomRequestImage(existing),
  });

  return { message: 'Custom request image deleted successfully' };
};

module.exports = {
  createPublicCustomRequest,
  getAdminCustomRequests,
  getAdminCustomRequestByPublicId,
  updateAdminCustomRequest,
  updateCustomRequestStatus,
  getCustomRequestImages,
  addCustomRequestImage,
  updateCustomRequestImage,
  deleteCustomRequestImage,
  sanitizeCustomRequest,
};
