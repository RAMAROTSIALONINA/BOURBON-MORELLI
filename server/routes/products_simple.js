const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// GET /api/products - Version simplifiée pour test
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Requête simple sans paramètres complexes
    const [products] = await connection.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `);

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
      category: {
        id: product.category_id,
        name: product.category_name,
        slug: product.category_slug
      },
      images: product.primary_image ? [product.primary_image] : [],
      status: product.status,
      featured: Boolean(product.featured),
      created_at: product.created_at
    }));

    res.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length
    });

  } catch (error) {
    console.error('Erreur produits:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// GET /api/products/:id - Version simplifiée
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
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (products.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas'
      });
    }

    // Récupérer les images
    const [images] = await connection.execute(
      'SELECT image_url, alt_text FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
      [id]
    );

    await connection.end();

    const product = products[0];
    
    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        short_description: product.short_description,
        sku: product.sku,
        price: parseFloat(product.price),
        compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
        category: {
          id: product.category_id,
          name: product.category_name,
          slug: product.category_slug
        },
        images: images.map(img => img.image_url),
        status: product.status,
        featured: Boolean(product.featured),
        created_at: product.created_at
      }
    });

  } catch (error) {
    console.error('Erreur produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

module.exports = router;
