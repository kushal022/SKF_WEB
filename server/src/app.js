const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const cookieParser = require('cookie-parser');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// 1. Basic Security Headers with Helmet
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = config.cors.allowedOrigins;
const isWildcardAllowed = allowedOrigins.includes('*');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (isWildcardAllowed) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, `CORS origin ${origin} is not allowed`, 'CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 3. Request Logging Middleware
app.use(requestLogger);

// 4. Body Parsing & Cookie Middleware (10mb limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. Root Health Check (Convenience alias for load balancers)
app.get('/health', (req, res) => {
  res.status(200).json(
    ApiResponse.success('API is healthy', {
      status: 'ok',
      service: 'SKF Stainless Steel Furniture API',
    })
  );
});

// 6. Mount Versioned API Routes (/api/v1)
app.use(config.apiPrefix, apiRoutes);

// 7. 404 Route Handler
app.use(notFound);

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
