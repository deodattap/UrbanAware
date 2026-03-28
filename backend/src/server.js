// src/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/drives',    require('./routes/drives'));
app.use('/api/report',    require('./routes/report'));
app.use('/api/user',      require('./routes/user'));
app.use('/api/quiz',      require('./routes/quiz'));
app.use('/api/dashboard', require('./routes/dashboard'));

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
    app.listen(PORT, () =>
      console.log(`⚠️  Server running WITHOUT DB on http://localhost:${PORT}`)
    );
  });

module.exports = app;
