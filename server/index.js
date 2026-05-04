const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products_simple');
const productPublicRoutes = require('./routes/products_public');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/upload');
const adminStatsRoutes = require('./routes/admin_stats');
const adminAnalyticsRoutes = require('./routes/admin_analytics');
const adminReportsRoutes = require('./routes/admin_reports');
const contactRoutes = require('./routes/contact');
const footerRoutes = require('./routes/footer');
const footerPublicRoutes = require('./routes/footer_public');
const siteSettingsRoutes = require('./routes/site_settings');
const wishlistRoutes = require('./routes/wishlist');

const app = express();
const PORT = process.env.PORT || 5000;

// Test de connexion à la base de données
testConnection();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  // ✅ Autoriser le chargement cross-origin des fichiers statiques (images uploadées)
  // Sans ça, <img src="http://localhost:5003/uploads/..."/> est bloqué depuis localhost:3000
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — permissif en dev, strict en prod
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  // Ne pas limiter les fichiers statiques ni le health check
  skip: (req) => req.path === '/health' || req.path.startsWith('/uploads')
});

app.use('/api/', limiter);

// Stripe webhook needs raw body before JSON parsing
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/public/products', productPublicRoutes);
app.use('/api/public/footer', footerPublicRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/footer', footerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  
  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.errors
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide'
    });
  }
  
  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré'
    });
  }
  
  // Erreur de base de données
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Entrée en double',
      message: 'Cette ressource existe déjà'
    });
  }
  
  // Erreur par défaut
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;
