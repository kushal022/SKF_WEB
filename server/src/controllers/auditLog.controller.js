const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const auditService = require('../services/audit.service');

const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.listAuditLogs(req.query);
  return res.status(200).json(ApiResponse.success('Audit logs retrieved successfully', result));
});

const getAdminAuditLogByPublicId = asyncHandler(async (req, res) => {
  const auditLog = await auditService.getAuditLogByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Audit log retrieved successfully', { auditLog }));
});

module.exports = {
  getAdminAuditLogs,
  getAdminAuditLogByPublicId,
};
