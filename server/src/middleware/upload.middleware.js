const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.ico'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.includes(mime);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeValid || isExtValid) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP, SVG, GIF, ICO. Received: ${file.mimetype}`,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
});

/**
 * Middleware wrapper to catch multer errors and format as ApiError
 */
const uploadSingle = (fieldName = 'file') => {
  const multerMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(400, 'Image file size exceeds the 10MB limit.', 'FILE_TOO_LARGE')
          );
        }
        return next(new ApiError(400, `Upload error: ${err.message}`, 'UPLOAD_ERROR'));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};
