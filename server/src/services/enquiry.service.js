const ApiError = require('../utils/ApiError');
const Enquiry = require('../models/Enquiry');
const EnquiryNote = require('../models/EnquiryNote');
const EnquiryStatusLog = require('../models/EnquiryStatusLog');
const EnquiryFollowUp = require('../models/EnquiryFollowUp');
const Product = require('../models/Product');
const User = require('../models/User');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_ENQUIRY_TRANSITIONS = {
  new: ['contacted', 'quotation_sent', 'lost'],
  contacted: ['quotation_sent', 'negotiation', 'confirmed', 'lost'],
  quotation_sent: ['negotiation', 'confirmed', 'lost'],
  negotiation: ['quotation_sent', 'confirmed', 'lost'],
  confirmed: ['completed', 'lost'],
  completed: [],
  lost: ['new', 'contacted'],
};

/**
 * Format enquiry note into safe API response.
 */
const sanitizeEnquiryNote = (note) => {
  if (!note) return null;
  return {
    public_id: note.public_id,
    note: note.note,
    user: note.user
      ? {
          public_id: note.user.public_id,
          name: note.user.name,
          email: note.user.email,
        }
      : null,
    created_at: note.created_at,
  };
};

/**
 * Format status log into safe API response.
 */
const sanitizeStatusLog = (log) => {
  if (!log) return null;
  return {
    public_id: log.public_id,
    from_status: log.from_status,
    to_status: log.to_status,
    comment: log.comment,
    changed_by: log.changedBy
      ? {
          public_id: log.changedBy.public_id,
          name: log.changedBy.name,
          email: log.changedBy.email,
        }
      : null,
    created_at: log.created_at,
  };
};

/**
 * Format follow-up into safe API response.
 */
const sanitizeFollowUp = (item) => {
  if (!item) return null;
  return {
    public_id: item.public_id,
    follow_up_at: item.follow_up_at,
    status: item.status,
    note: item.note,
    completed_at: item.completed_at,
    assigned_to: item.assignedTo
      ? {
          public_id: item.assignedTo.public_id,
          name: item.assignedTo.name,
          email: item.assignedTo.email,
        }
      : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

/**
 * Format enquiry into safe API representation.
 */
const sanitizeEnquiry = (enquiry, isAdmin = false) => {
  if (!enquiry) return null;

  const base = {
    public_id: enquiry.public_id,
    customer_name: enquiry.customer_name,
    phone: enquiry.phone,
    email: enquiry.email || null,
    source: enquiry.source || null,
    message: enquiry.message || null,
    status: enquiry.status,
    product: enquiry.product
      ? {
          public_id: enquiry.product.public_id,
          name: enquiry.product.name,
          slug: enquiry.product.slug,
        }
      : null,
    custom_request: enquiry.customRequest
      ? {
          public_id: enquiry.customRequest.public_id,
          product_type: enquiry.customRequest.product_type,
          status: enquiry.customRequest.status,
        }
      : null,
    created_at: enquiry.created_at,
    updated_at: enquiry.updated_at,
  };

  if (isAdmin) {
    if (Array.isArray(enquiry.notes)) {
      base.notes = enquiry.notes.map(sanitizeEnquiryNote);
    }
    if (Array.isArray(enquiry.statusLogs)) {
      base.status_logs = enquiry.statusLogs.map(sanitizeStatusLog);
    }
    if (Array.isArray(enquiry.followUps)) {
      base.follow_ups = enquiry.followUps.map(sanitizeFollowUp);
    }
  }

  return base;
};

/**
 * Public create enquiry.
 */
const createPublicEnquiry = async (data) => {
  let product_id = null;
  const productIdentifier = data.product_id || data.product_public_id;

  if (productIdentifier) {
    const product = await Product.query()
      .where({ public_id: productIdentifier, status: 'published' })
      .first();

    if (!product) {
      throw new ApiError(
        404,
        'Product not found or not available for enquiry',
        'PRODUCT_NOT_FOUND'
      );
    }
    product_id = product.id;
  }

  const newEnquiry = await Enquiry.query().insertAndFetch({
    customer_name: data.customer_name,
    phone: data.phone,
    email: data.email || null,
    source: data.source || 'website',
    message: data.message || null,
    product_id,
    status: 'new',
  });

  try {
    const notificationService = require('./notification.service');
    await notificationService.createForAdmins({
      type: 'enquiry',
      title: 'New Website Enquiry',
      message: `Enquiry from ${data.customer_name} (${data.phone})`,
      data: {
        enquiry_public_id: newEnquiry.public_id,
        customer_name: data.customer_name,
        phone: data.phone,
      },
      related_entity_type: 'Enquiry',
    });
  } catch {
    // Non-blocking notification dispatch
  }

  return {
    public_id: newEnquiry.public_id,
    customer_name: newEnquiry.customer_name,
    phone: newEnquiry.phone,
    status: newEnquiry.status,
    created_at: newEnquiry.created_at,
  };
};

/**
 * Admin enquiry list.
 */
const getAdminEnquiries = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Enquiry.query()
    .withGraphFetched('[product, customRequest]')
    .modifiers({
      selectProduct(b) {
        b.select('id', 'public_id', 'name', 'slug');
      },
    });

  if (query.status) {
    builder = builder.where('status', query.status);
  }

  if (query.source) {
    builder = builder.where('source', query.source);
  }

  if (query.product_id || query.product_public_id) {
    const pid = query.product_id || query.product_public_id;
    const prod = await Product.query().where({ public_id: pid }).first();
    builder = builder.where('product_id', prod ? prod.id : 0);
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
        .orWhere('message', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  const allowedSorts = ['created_at', 'updated_at', 'customer_name', 'status'];
  const finalSortField = allowedSorts.includes(sortField) ? sortField : 'created_at';

  builder = builder.orderBy(finalSortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((e) => sanitizeEnquiry(e, false)),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin enquiry detail.
 */
const getAdminEnquiryByPublicId = async (publicId) => {
  const enquiry = await Enquiry.query()
    .where({ public_id: publicId })
    .withGraphFetched('[product, customRequest, notes.user, statusLogs.changedBy, followUps.assignedTo]')
    .modifyGraph('notes', (b) => b.orderBy('created_at', 'desc'))
    .modifyGraph('statusLogs', (b) => b.orderBy('created_at', 'desc'))
    .modifyGraph('followUps', (b) => b.orderBy('follow_up_at', 'asc'))
    .first();

  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  return sanitizeEnquiry(enquiry, true);
};

/**
 * Admin update enquiry basic fields.
 */
const updateAdminEnquiry = async (publicId, data, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const oldValues = sanitizeEnquiry(enquiry, false);
  const updated = await Enquiry.query().patchAndFetchById(enquiry.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_ENQUIRY',
    entityType: 'Enquiry',
    entityId: enquiry.id,
    oldValues,
    newValues: sanitizeEnquiry(updated, false),
  });

  return sanitizeEnquiry(updated, true);
};

/**
 * Admin update enquiry status with transaction and status history log.
 */
const updateEnquiryStatus = async (publicId, { status, comment }, req) => {
  return Enquiry.transaction(async (trx) => {
    const enquiry = await Enquiry.query(trx).where({ public_id: publicId }).first();
    if (!enquiry) {
      throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
    }

    if (enquiry.status !== status) {
      const allowed = VALID_ENQUIRY_TRANSITIONS[enquiry.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(
          400,
          `Cannot transition enquiry status from '${enquiry.status}' to '${status}'`,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }

    const fromStatus = enquiry.status;
    const updated = await Enquiry.query(trx).patchAndFetchById(enquiry.id, { status });

    await EnquiryStatusLog.query(trx).insert({
      enquiry_id: enquiry.id,
      from_status: fromStatus,
      to_status: status,
      changed_by: req.user ? req.user.id : null,
      comment: comment || null,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'UPDATE_ENQUIRY_STATUS',
        entityType: 'Enquiry',
        entityId: enquiry.id,
        oldValues: { status: fromStatus },
        newValues: { status },
        metadata: { comment: comment || null },
      },
      trx
    );

    return sanitizeEnquiry(updated, false);
  });
};

/**
 * Notes CRUD
 */
const getEnquiryNotes = async (publicId) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const notes = await EnquiryNote.query()
    .where({ enquiry_id: enquiry.id })
    .withGraphFetched('user')
    .orderBy('created_at', 'desc');

  return notes.map(sanitizeEnquiryNote);
};

const createEnquiryNote = async (publicId, { note }, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const created = await EnquiryNote.query()
    .insertAndFetch({
      enquiry_id: enquiry.id,
      user_id: req.user ? req.user.id : null,
      note,
    })
    .withGraphFetched('user');

  await auditService.logRequestAction(req, {
    action: 'CREATE_ENQUIRY_NOTE',
    entityType: 'EnquiryNote',
    entityId: created.id,
    newValues: sanitizeEnquiryNote(created),
  });

  return sanitizeEnquiryNote(created);
};

const updateEnquiryNote = async (publicId, notePublicId, { note }, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const existing = await EnquiryNote.query()
    .where({ public_id: notePublicId, enquiry_id: enquiry.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Enquiry note not found', 'NOTE_NOT_FOUND');
  }

  const oldValues = sanitizeEnquiryNote(existing);
  const updated = await EnquiryNote.query()
    .patchAndFetchById(existing.id, { note })
    .withGraphFetched('user');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_ENQUIRY_NOTE',
    entityType: 'EnquiryNote',
    entityId: existing.id,
    oldValues,
    newValues: sanitizeEnquiryNote(updated),
  });

  return sanitizeEnquiryNote(updated);
};

const deleteEnquiryNote = async (publicId, notePublicId, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const existing = await EnquiryNote.query()
    .where({ public_id: notePublicId, enquiry_id: enquiry.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Enquiry note not found', 'NOTE_NOT_FOUND');
  }

  await EnquiryNote.query().deleteById(existing.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_ENQUIRY_NOTE',
    entityType: 'EnquiryNote',
    entityId: existing.id,
    oldValues: sanitizeEnquiryNote(existing),
  });

  return { message: 'Enquiry note deleted successfully' };
};

/**
 * Follow-Ups CRUD
 */
const getEnquiryFollowUps = async (publicId) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const items = await EnquiryFollowUp.query()
    .where({ enquiry_id: enquiry.id })
    .withGraphFetched('assignedTo')
    .orderBy('follow_up_at', 'asc');

  return items.map(sanitizeFollowUp);
};

const createEnquiryFollowUp = async (publicId, data, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  let assigned_to = null;
  if (data.assigned_to) {
    const user = await User.query().where({ public_id: data.assigned_to }).first();
    if (!user) {
      throw new ApiError(404, 'Assigned user not found', 'USER_NOT_FOUND');
    }
    assigned_to = user.id;
  }

  const created = await EnquiryFollowUp.query()
    .insertAndFetch({
      enquiry_id: enquiry.id,
      assigned_to,
      follow_up_at: new Date(data.follow_up_at),
      note: data.note || null,
      status: data.status || 'pending',
    })
    .withGraphFetched('assignedTo');

  await auditService.logRequestAction(req, {
    action: 'CREATE_ENQUIRY_FOLLOW_UP',
    entityType: 'EnquiryFollowUp',
    entityId: created.id,
    newValues: sanitizeFollowUp(created),
  });

  return sanitizeFollowUp(created);
};

const updateEnquiryFollowUp = async (publicId, followUpPublicId, data, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const existing = await EnquiryFollowUp.query()
    .where({ public_id: followUpPublicId, enquiry_id: enquiry.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Follow-up not found', 'FOLLOW_UP_NOT_FOUND');
  }

  const patchData = {};
  if (data.follow_up_at) {
    patchData.follow_up_at = new Date(data.follow_up_at);
  }
  if (data.assigned_to !== undefined) {
    if (data.assigned_to === null) {
      patchData.assigned_to = null;
    } else {
      const user = await User.query().where({ public_id: data.assigned_to }).first();
      if (!user) {
        throw new ApiError(404, 'Assigned user not found', 'USER_NOT_FOUND');
      }
      patchData.assigned_to = user.id;
    }
  }
  if (data.note !== undefined) {
    patchData.note = data.note;
  }
  if (data.status !== undefined) {
    patchData.status = data.status;
    if (data.status === 'completed' && !data.completed_at && !existing.completed_at) {
      patchData.completed_at = new Date();
    }
  }
  if (data.completed_at !== undefined) {
    patchData.completed_at = data.completed_at ? new Date(data.completed_at) : null;
  }

  const oldValues = sanitizeFollowUp(existing);
  const updated = await EnquiryFollowUp.query()
    .patchAndFetchById(existing.id, patchData)
    .withGraphFetched('assignedTo');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_ENQUIRY_FOLLOW_UP',
    entityType: 'EnquiryFollowUp',
    entityId: existing.id,
    oldValues,
    newValues: sanitizeFollowUp(updated),
  });

  return sanitizeFollowUp(updated);
};

const deleteEnquiryFollowUp = async (publicId, followUpPublicId, req) => {
  const enquiry = await Enquiry.query().where({ public_id: publicId }).first();
  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found', 'ENQUIRY_NOT_FOUND');
  }

  const existing = await EnquiryFollowUp.query()
    .where({ public_id: followUpPublicId, enquiry_id: enquiry.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'Follow-up not found', 'FOLLOW_UP_NOT_FOUND');
  }

  await EnquiryFollowUp.query().deleteById(existing.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_ENQUIRY_FOLLOW_UP',
    entityType: 'EnquiryFollowUp',
    entityId: existing.id,
    oldValues: sanitizeFollowUp(existing),
  });

  return { message: 'Enquiry follow-up deleted successfully' };
};

module.exports = {
  createPublicEnquiry,
  getAdminEnquiries,
  getAdminEnquiryByPublicId,
  updateAdminEnquiry,
  updateEnquiryStatus,
  getEnquiryNotes,
  createEnquiryNote,
  updateEnquiryNote,
  deleteEnquiryNote,
  getEnquiryFollowUps,
  createEnquiryFollowUp,
  updateEnquiryFollowUp,
  deleteEnquiryFollowUp,
  sanitizeEnquiry,
};
