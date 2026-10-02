const ApiError = require('../utils/ApiError');
const {
  User,
  Product,
  Enquiry,
  CustomRequest,
  B2BAccount,
  Quotation,
  Order,
  Payment,
} = require('../models');

/**
 * Retrieves safe admin profile information.
 * Ensures the user exists, is non-deleted, active, and holds the 'admin' role.
 *
 * @param {number|string} userId - Internal user ID from authenticated request
 * @returns {Promise<object>} Sanitized admin profile
 */
const getAdminProfile = async (userId) => {
  const user = await User.query()
    .findById(userId)
    .whereNull('deleted_at')
    .first();

  if (!user) {
    throw new ApiError(404, 'Admin user account not found', 'USER_NOT_FOUND');
  }

  if (user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin role required.', 'FORBIDDEN');
  }

  if (user.status !== 'active') {
    throw new ApiError(401, 'Admin account is not active', 'ACCOUNT_INACTIVE');
  }

  return {
    public_id: user.public_id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    status: user.status,
    last_login_at: user.last_login_at || null,
  };
};

/**
 * Calculates system-wide summary metrics for the Admin dashboard.
 * Executes optimized, concurrent aggregate queries across domain tables.
 *
 * @returns {Promise<object>} Aggregated entity metrics
 */
const getDashboardSummary = async () => {
  const [
    userTotalRes,
    userActiveRes,
    productCounts,
    enquiryCounts,
    customRequestCounts,
    b2bCounts,
    quotationCounts,
    orderCounts,
    paymentCounts,
  ] = await Promise.all([
    // 1. Users: Total non-deleted users
    User.query()
      .whereNull('deleted_at')
      .count('* as count')
      .first(),

    // 2. Users: Active non-deleted users
    User.query()
      .whereNull('deleted_at')
      .where('status', 'active')
      .count('* as count')
      .first(),

    // 3. Products by status (draft, published, archived)
    Product.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),

    // 4. Enquiries by status (new, contacted, quotation_sent, etc.)
    Enquiry.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),

    // 5. Custom Requests by status (new, reviewing, quoted, etc.)
    CustomRequest.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),

    // 6. B2B Accounts by verification_status (pending, approved, rejected, suspended)
    B2BAccount.query()
      .select('verification_status')
      .count('* as count')
      .groupBy('verification_status'),

    // 7. Quotations by status (draft, sent, accepted, rejected, expired, cancelled)
    Quotation.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),

    // 8. Orders by status (pending, confirmed, manufacturing, ready, dispatched, delivered, cancelled)
    Order.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),

    // 9. Payments by status (pending, paid, failed, refunded, partially_refunded)
    Payment.query()
      .select('status')
      .count('* as count')
      .groupBy('status'),
  ]);

  // Aggregate Products
  let totalProducts = 0;
  let publishedProducts = 0;
  let draftProducts = 0;
  for (const row of productCounts) {
    const count = Number(row.count || 0);
    totalProducts += count;
    if (row.status === 'published') publishedProducts = count;
    if (row.status === 'draft') draftProducts = count;
  }

  // Aggregate Enquiries
  let totalEnquiries = 0;
  let newEnquiries = 0;
  for (const row of enquiryCounts) {
    const count = Number(row.count || 0);
    totalEnquiries += count;
    if (row.status === 'new') newEnquiries = count;
  }

  // Aggregate Custom Requests
  let totalCustomRequests = 0;
  let newCustomRequests = 0;
  for (const row of customRequestCounts) {
    const count = Number(row.count || 0);
    totalCustomRequests += count;
    if (row.status === 'new') newCustomRequests = count;
  }

  // Aggregate B2B Accounts
  let totalB2B = 0;
  let pendingB2B = 0;
  for (const row of b2bCounts) {
    const count = Number(row.count || 0);
    totalB2B += count;
    if (row.verification_status === 'pending') pendingB2B = count;
  }

  // Aggregate Quotations
  let totalQuotations = 0;
  let sentQuotations = 0;
  let acceptedQuotations = 0;
  for (const row of quotationCounts) {
    const count = Number(row.count || 0);
    totalQuotations += count;
    if (row.status === 'sent') sentQuotations = count;
    if (row.status === 'accepted') acceptedQuotations = count;
  }

  // Aggregate Orders
  let totalOrders = 0;
  let pendingOrders = 0;
  let confirmedOrders = 0;
  let manufacturingOrders = 0;
  for (const row of orderCounts) {
    const count = Number(row.count || 0);
    totalOrders += count;
    if (row.status === 'pending') pendingOrders = count;
    if (row.status === 'confirmed') confirmedOrders = count;
    if (row.status === 'manufacturing') manufacturingOrders = count;
  }

  // Aggregate Payments
  let totalPayments = 0;
  let paidPayments = 0;
  let pendingPayments = 0;
  let failedPayments = 0;
  for (const row of paymentCounts) {
    const count = Number(row.count || 0);
    totalPayments += count;
    if (row.status === 'paid') paidPayments = count;
    if (row.status === 'pending') pendingPayments = count;
    if (row.status === 'failed') failedPayments = count;
  }

  return {
    users: {
      total: Number(userTotalRes?.count || 0),
      active: Number(userActiveRes?.count || 0),
    },
    products: {
      total: totalProducts,
      published: publishedProducts,
      draft: draftProducts,
    },
    enquiries: {
      total: totalEnquiries,
      new: newEnquiries,
    },
    customRequests: {
      total: totalCustomRequests,
      new: newCustomRequests,
    },
    b2bAccounts: {
      total: totalB2B,
      pending: pendingB2B,
    },
    quotations: {
      total: totalQuotations,
      sent: sentQuotations,
      accepted: acceptedQuotations,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      manufacturing: manufacturingOrders,
    },
    payments: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      failed: failedPayments,
    },
  };
};

module.exports = {
  getAdminProfile,
  getDashboardSummary,
};
