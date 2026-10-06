const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const uploadService = require('../services/upload.service');
const auditService = require('../services/audit.service');

/**
 * Controller to handle single media/image uploads.
 * POST /api/v1/admin/uploads
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select an image file to upload.', 'FILE_REQUIRED');
  }

  const folder = typeof req.body.folder === 'string' && req.body.folder.trim()
    ? req.body.folder.trim().replace(/[^a-zA-Z0-9_/ -]/g, '')
    : 'skf_furniture';

  const result = await uploadService.uploadImage(req.file, {
    folder,
    req,
  });

  // Optional: Audit log upload action
  try {
    await auditService.logRequestAction(req, {
      action: 'UPLOAD_IMAGE',
      entityType: 'Media',
      entityId: result.public_id || 'unknown',
      details: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        storage: uploadService.isCloudinaryConfigured() ? 'cloudinary' : 'local',
        public_id: result.public_id,
        url: result.secure_url || result.url,
      },
    });
  } catch (auditErr) {
    // Non-blocking for upload completion
    console.error('[Upload Audit Warning]:', auditErr.message);
  }

  return res.status(201).json(
    ApiResponse.success('Image uploaded successfully', {
      url: result.secure_url || result.url,
      secure_url: result.secure_url || result.url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      original_filename: result.original_filename,
      storage: uploadService.isCloudinaryConfigured() ? 'cloudinary' : 'local',
    })
  );
});

module.exports = {
  uploadImage,
};
