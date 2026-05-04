const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// GET /api/products - Récupérer tous les produits actifs (public)
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const [products] = await connection.execute(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(i.quantity, 0) as stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `);

    // Récupérer TOUTES les images pour TOUS les produits en une seule requête
    let imagesByProduct = {};
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const placeholders = productIds.map(() => '?').join(',');
      const [allImages] = await connection.execute(
        `SELECT product_id, image_url FROM product_images
         WHERE product_id IN (${placeholders})
         ORDER BY is_primary DESC, id ASC`,
        productIds
      );
      imagesByProduct = allImages.reduce((acc, img) => {
        if (!acc[img.product_id]) acc[img.product_id] = [];
        acc[img.product_id].push(img.image_url);
        return acc;
      }, {});
    }

    await connection.end();

    // Formatage simple
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
      weight: product.weight ? parseFloat(product.weight) : null,
      category: product.category_name || 'Non catégorisé',
      category_slug: product.category_slug,
      brand: product.brand,
      sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
      status: product.status,
      featured: product.featured,
      images: imagesByProduct[product.id] || [],
      stock: product.stock,
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    res.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les produits'
    });
  }
});

// GET /api/products/:id - Récupérer un produit spécifique (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const [products] = await connection.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(i.quantity, 0) as stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (products.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas'
      });
    }

    // Récupérer toutes les images du produit
    const [images] = await connection.execute(`
      SELECT image_url, alt_text, is_primary
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC
    `, [id]);

    await connection.end();

    const product = products[0];
    
    const formattedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
      weight: product.weight ? parseFloat(product.weight) : null,
      category: product.category_name || 'Non catégorisé',
      category_slug: product.category_slug,
      brand: product.brand,
      sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
      status: product.status,
      featured: product.featured,
      stock: product.stock,
      images: images.map(img => img.image_url),
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    res.json({
      success: true,
      product: formattedProduct
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le produit'
    });
  }
});

// GET /api/products/category/:categoryName - Récupérer les produits par catégorie (public)
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const [products] = await connection.execute(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(i.quantity, 0) as stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'active' AND (c.name = ? OR c.slug = ?)
      ORDER BY p.created_at DESC
    `, [categoryName, categoryName]);

    // Récupérer TOUTES les images pour TOUS les produits en une seule requête
    let imagesByProduct = {};
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const placeholders = productIds.map(() => '?').join(',');
      const [allImages] = await connection.execute(
        `SELECT product_id, image_url FROM product_images
         WHERE product_id IN (${placeholders})
         ORDER BY is_primary DESC, id ASC`,
        productIds
      );
      imagesByProduct = allImages.reduce((acc, img) => {
        if (!acc[img.product_id]) acc[img.product_id] = [];
        acc[img.product_id].push(img.image_url);
        return acc;
      }, {});
    }

    await connection.end();

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
      weight: product.weight ? parseFloat(product.weight) : null,
      category: product.category_name || 'Non catégorisé',
      category_slug: product.category_slug,
      brand: product.brand,
      sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
      status: product.status,
      featured: product.featured,
      images: imagesByProduct[product.id] || [],
      stock: product.stock,
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    res.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
      category: categoryName
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits par catégorie:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les produits de cette catégorie'
    });
  }
});

// GET /api/public/products/:id/reviews - Liste publique des avis approuvés d'un produit
router.get('/:id/reviews', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const productId = req.params.id;
    const rows = await query(
      `SELECT pr.id, pr.product_id, pr.user_id, pr.rating, pr.title, pr.content,
              pr.is_verified, pr.created_at,
              u.first_name, u.last_name
       FROM product_reviews pr
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE pr.product_id = ?
         AND (pr.is_approved = 1 OR pr.is_approved IS NULL)
       ORDER BY pr.created_at DESC`,
      [productId]
    );
    res.json({ reviews: rows, total: rows.length });
  } catch (err) {
    console.error('Erreur GET /public/products/:id/reviews:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
