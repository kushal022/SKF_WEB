const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SKF Stainless Steel Furniture API',
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
