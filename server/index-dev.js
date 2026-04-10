const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

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
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images)
app.use('/images', express.static('public/images'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'BOURBON MORELLI API - Mode développement'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BOURBON MORELLI API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      categories: '/api/categories',
      auth: '/api/auth',
      cart: '/api/cart',
      orders: '/api/orders'
    }
  });
});

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: 'Nappe de Table Luxe',
    slug: 'nappe-de-table-luxe',
    price: 89.99,
    compare_price: 119.99,
    description: 'Une nappe de table élégante en coton premium, parfaite pour les occasions spéciales.',
    category: { name: 'Nappes' },
    images: ['/images/Nape%20de%20table.PNG', '/images/Nape%20de%20table1.PNG', '/images/Nape%20de%20table2.PNG'],
    featured: true,
    rating: 5,
    reviews_count: 12,
    inventory_quantity: 5
  },
  {
    id: 2,
    name: 'T-shirt Premium',
    slug: 'tshirt-premium',
    price: 39.99,
    description: 'T-shirt en coton bio de haute qualité, confortable et durable.',
    category: { name: 'T-Shirts' },
    images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
    featured: true,
    rating: 4,
    reviews_count: 8,
    inventory_quantity: 3
  },
  {
    id: 3,
    name: 'Polo Classique',
    slug: 'polo-classique',
    price: 49.99,
    description: 'Polo en piqué de coton avec col traditionnel, idéal pour le sport et le casual.',
    category: { name: 'Polos' },
    images: ['/images/Polos.PNG', '/images/Polos%201.PNG', '/images/Polos%202.PNG'],
    featured: false,
    rating: 4,
    reviews_count: 6,
    inventory_quantity: 15
  },
  {
    id: 4,
    name: 'Pantalon Chic',
    slug: 'pantalon-chic',
    price: 79.99,
    description: 'Pantalon élégant en laine mélangée, parfait pour le bureau et les événements.',
    category: { name: 'Pantalons' },
    images: ['/images/Pantalons.PNG', '/images/Pantalons%201.PNG', '/images/Pantalons%202.PNG'],
    featured: true,
    rating: 5,
    reviews_count: 10,
    inventory_quantity: 8
  }
];

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API BOURBON MORELLI',
    version: '1.0.0',
    status: 'Actif',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      health: '/api/health'
    }
  });
});

// API Routes
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  
  let filteredProducts = [...mockProducts];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => {
      const categoryName = p.category.name.toLowerCase();
      const categorySlug = p.category.name.toLowerCase().replace(/\s+/g, '-');
      const requestedCategory = category.toLowerCase();
      
      return categoryName === requestedCategory || categorySlug === requestedCategory;
    });
  }
  
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

// Route pour un produit spécifique par slug
app.get('/api/products/:slug', (req, res) => {
  const { slug } = req.params;
  
  const product = mockProducts.find(p => p.slug === slug);
  
  if (!product) {
    return res.status(404).json({
      error: 'Produit non trouvé',
      message: `Le produit avec le slug "${slug}" n'existe pas`
    });
  }
  
  res.json({
    ...product,
    similar_products: mockProducts.filter(p => p.id !== product.id).slice(0, 4)
  });
});

app.get('/api/products/featured/list', (req, res) => {
  const featured = mockProducts.filter(p => p.featured);
  res.json(featured);
});

// Mock categories
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 1, name: 'Nappes', slug: 'nappes', product_count: 8 },
    { id: 2, name: 'T-Shirts', slug: 't-shirts', product_count: 12 },
    { id: 3, name: 'Polos', slug: 'polos', product_count: 10 },
    { id: 4, name: 'Pantalons', slug: 'pantalons', product_count: 6 }
  ];
  
  res.json(categories);
});

// Mock auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  
  // Simuler l'inscription
  setTimeout(() => {
    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: 1,
        first_name,
        last_name,
        email,
        role: 'customer'
      },
      token: 'mock_jwt_token_development'
    });
  }, 1000);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simuler la connexion
  setTimeout(() => {
    res.json({
      message: 'Connexion réussie',
      user: {
        id: 1,
        first_name: 'Jean',
        last_name: 'Dupont',
        email,
        role: 'customer'
      },
      token: 'mock_jwt_token_development'
    });
  }, 1000);
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean.dupont@email.com',
      role: 'customer',
      addresses: [],
      stats: {
        total_orders: 5,
        total_spent: 1299.99,
        last_order_date: new Date().toISOString()
      }
    }
  });
});

// Cart endpoints
app.get('/api/cart', (req, res) => {
  res.json({
    items: [],
    subtotal: 0,
    total_items: 0
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Serveur de développement démarré sur le port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💡 Mode: Développement (sans base de données)`);
});

module.exports = app;
