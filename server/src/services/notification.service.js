const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');

const sanitizeNotification = (notification) => {
  if (!notification) return null;

  return {
    public_id: notification.public_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data || null,
    channel: notification.channel,
    is_read: Boolean(notification.is_read),
    read_at: notification.read_at || null,
    related_entity_type: notification.related_entity_type || null,
    user: notification.user
      ? {
          public_id: notification.user.public_id,
          name: notification.user.name,
          email: notification.user.email,
        }
      : null,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
  };
};

const listNotifications = async (queryParams, currentUser = null) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const { user_public_id, type, is_read, sort_order = 'desc' } = queryParams;

  const query = Notification.query()
    .withGraphFetched('user')
    .orderBy('created_at', sort_order.toLowerCase());

  if (user_public_id) {
    const user = await User.query().where('public_id', user_public_id).first();
    if (user) {
      query.where('notifications.user_id', user.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (type) {
    query.where('notifications.type', type);
  }

  if (is_read !== undefined) {
    const boolVal = is_read === 'true' || is_read === '1';
    query.where('notifications.is_read', boolVal);
  }

  const totalQuery = query.clone().clearOrder().count('* as count').first();
  const [totalRes, items] = await Promise.all([totalQuery, query.offset(offset).limit(limit)]);

  const total = parseInt(totalRes?.count || 0, 10);
  const sanitizedItems = items.map(sanitizeNotification);

  return formatPaginatedResponse({
    items: sanitizedItems,
    total,
    page,
    limit,
  });
};

const getNotificationByPublicId = async (publicId) => {
  const notification = await Notification.query()
    .where('public_id', publicId)
    .withGraphFetched('user')
    .first();

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return sanitizeNotification(notification);
};

const createNotification = async (data, trx = null) => {
  let userId = null;
  if (data.user_public_id) {
    const user = await User.query(trx).where('public_id', data.user_public_id).first();
    if (!user) {
      throw ApiError.badRequest('Referenced user not found');
    }
    userId = user.id;
  } else if (data.user_id) {
    userId = data.user_id;
  }

  const notification = await Notification.query(trx).insert({
    public_id: crypto.randomUUID(),
    user_id: userId,
    type: data.type.trim(),
    title: data.title.trim(),
    message: data.message.trim(),
    data: data.data || null,
    channel: data.channel?.trim() || 'in_app',
    is_read: false,
    read_at: null,
    related_entity_type: data.related_entity_type?.trim() || null,
    related_entity_id: data.related_entity_id || null,
  });

  const createdNotification = await getNotificationByPublicId(notification.public_id);

  // Emit real-time notification via Socket.IO
  try {
    const notificationSocket = require('../socket/notification.socket');
    const emitEvent = () => {
      notificationSocket.emitNewNotification({
        ...createdNotification,
        user_id: userId,
      });
    };

    if (trx && typeof trx.executionPromise?.then === 'function') {
      trx.executionPromise.then(emitEvent).catch(() => {});
    } else {
      emitEvent();
    }
  } catch (socketErr) {
    // Non-blocking failsafe: socket failure must never disrupt database operations
    console.error('[Socket] Real-time notification emission failed:', socketErr.message);
  }

  return createdNotification;
};

const createForUser = async (userPublicId, notificationData, trx = null) => {
  return createNotification({ ...notificationData, user_public_id: userPublicId }, trx);
};

const createForAdmins = async (notificationData, trx = null) => {
  const admins = await User.query(trx).whereIn('role', ['admin', 'super_admin']).where('status', 'active');
  const results = [];
  for (const admin of admins) {
    const n = await createNotification(
      {
        ...notificationData,
        user_id: admin.id,
      },
      trx
    );
    results.push(n);
  }
  return results;
};

const markAsRead = async (publicId, reqUser = null) => {
  const notification = await Notification.query().where('public_id', publicId).first();
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id && reqUser && reqUser.role !== 'admin' && reqUser.role !== 'super_admin') {
    if (notification.user_id !== reqUser.id) {
      throw ApiError.forbidden('You do not have permission to modify this notification');
    }
  }

  if (!notification.is_read) {
    await Notification.query().where('id', notification.id).patch({
      is_read: true,
      read_at: new Date(),
    });
  }

  return getNotificationByPublicId(publicId);
};

const markAllAsRead = async (reqUser) => {
  if (!reqUser?.id) {
    throw ApiError.unauthorized('Authentication required to mark all notifications as read');
  }

  const query = Notification.query()
    .where('is_read', false)
    .where((q) => {
      q.where('user_id', reqUser.id).orWhereNull('user_id');
    });

  const updatedCount = await query.patch({
    is_read: true,
    read_at: new Date(),
  });

  return { message: 'All notifications marked as read', updated_count: updatedCount };
};

const deleteNotification = async (publicId, reqUser = null) => {
  const notification = await Notification.query().where('public_id', publicId).first();
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id && reqUser && reqUser.role !== 'admin' && reqUser.role !== 'super_admin') {
    if (notification.user_id !== reqUser.id) {
      throw ApiError.forbidden('You do not have permission to delete this notification');
    }
  }

  await Notification.query().deleteById(notification.id);
  return { message: 'Notification deleted successfully' };
};

module.exports = {
  sanitizeNotification,
  listNotifications,
  getNotificationByPublicId,
  createNotification,
  createForUser,
  createForAdmins,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
