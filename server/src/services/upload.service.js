const fs = require('fs');
const path = require('path');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('[Upload Service] Failed to create uploads directory:', err.message);
  }
}

/**
 * Upload an image buffer to Cloudinary
 *
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Upload options (folder, public_id, etc.)
 * @returns {Promise<object>}
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || env.cloudinary.folder || 'skf_furniture',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(500, `Cloudinary upload failed: ${error.message}`, 'CLOUDINARY_UPLOAD_ERROR')
          );
        }
        resolve({
          url: result.secure_url || result.url,
          secure_url: result.secure_url || result.url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Save an image buffer to local disk when Cloudinary is not configured
 *
 * @param {Buffer} buffer - File buffer
 * @param {object} file - Express multer file object
 * @param {object} req - Express request object for building full URL
 * @param {object} options - Additional options
 * @returns {Promise<object>}
 */
const saveToLocalDisk = async (buffer, file, req, options = {}) => {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const cleanBase = path
    .parse(file.originalname)
    .name.replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const fileName = `${options.folder || 'media'}_${Date.now()}_${cleanBase}${ext}`;
  const filePath = path.join(LOCAL_UPLOADS_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // Construct host/protocol URL
  const protocol = req && req.protocol ? req.protocol : 'http';
  let host = `localhost:${env.port}`;
  if (req) {
    if (typeof req.get === 'function') {
      host = req.get('host') || host;
    } else if (req.headers && req.headers.host) {
      host = req.headers.host;
    }
  }
  const fileUrl = `${protocol}://${host}/uploads/${fileName}`;

  return {
    url: fileUrl,
    secure_url: fileUrl,
    public_id: `local_${Date.now()}_${cleanBase}`,
    format: ext.replace('.', ''),
    width: null,
    height: null,
    bytes: file.size || buffer.length,
  };
};

/**
 * Upload Image Service Entry Point
 *
 * @param {object} file - Express multer file
 * @param {object} [options={}] - Options (folder, req)
 */
const uploadImage = async (file, options = {}) => {
  if (!file || !file.buffer) {
    throw new ApiError(400, 'No file buffer provided for upload', 'FILE_REQUIRED');
  }

  let result;
  if (isConfigured) {
    result = await uploadToCloudinary(file.buffer, {
      folder: options.folder,
    });
  } else {
    result = await saveToLocalDisk(file.buffer, file, options.req, {
      folder: options.folder,
    });
  }

  return {
    ...result,
    original_filename: file.originalname,
  };
};

module.exports = {
  uploadImage,
  uploadToCloudinary,
  saveToLocalDisk,
  isCloudinaryConfigured: () => isConfigured,
};
