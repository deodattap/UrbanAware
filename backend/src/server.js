// src/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/drives',  require('./routes/drives'));
app.use('/api/report',  require('./routes/report'));
app.use('/api/user',    require('./routes/user'));
app.use('/api/quiz',    require('./routes/quiz'));

// Dashboard route is optional (may not exist in all branches)
try {
  app.use('/api/dashboard', require('./routes/dashboard'));
} catch (e) {
  console.warn('⚠️  dashboard route not found — skipping.');
}

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`
  });
});

// ─── Global error handler ────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

// ─── DB + Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanaware')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    // Start server anyway so health check still responds
    app.listen(PORT, () =>
      console.log(`⚠️  Server running WITHOUT DB on http://localhost:${PORT}`)
    );
  });

module.exports = app;
