const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { query: dbQuery } = require('../config/database');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: errors.array()
    });
  }
  next();
};

// GET /api/products - Récupérer tous les produits avec filtres
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isString(),
  query('sort').optional().isIn(['price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest', 'rating']),
  query('featured').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'featured',
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construction de la requête WHERE
    let whereConditions = ['p.status = "active"'];
    let params = [];

    if (category) {
      whereConditions.push('c.slug = ?');
      params.push(category);
    }

    if (minPrice) {
      whereConditions.push('p.price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (featured) {
      whereConditions.push('p.featured = ?');
      params.push(featured === 'true');
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Construction de la clause ORDER BY
    let orderBy = 'ORDER BY p.featured DESC, p.created_at DESC';
    switch (sort) {
      case 'price-asc':
        orderBy = 'ORDER BY p.price ASC';
        break;
      case 'price-desc':
        orderBy = 'ORDER BY p.price DESC';
        break;
      case 'name-asc':
        orderBy = 'ORDER BY p.name ASC';
        break;
      case 'name-desc':
        orderBy = 'ORDER BY p.name DESC';
        break;
      case 'newest':
        orderBy = 'ORDER BY p.created_at DESC';
        break;
      case 'rating':
        orderBy = 'ORDER BY p.rating DESC, p.reviews_count DESC';
        break;
    }

    // Requête principale
    const productsQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as reviews_count,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      ${whereClause}
      GROUP BY p.id
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = await dbQuery(productsQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Requête pour le comptage total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const countResult = await dbQuery(countQuery, params);
    const total = countResult[0].total;

    // Formatage des résultats
    const formattedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      rating: product.rating ? parseFloat(product.rating) : null,
      inventory_quantity: parseInt(product.inventory_quantity),
      images: product.primary_image ? [product.primary_image] : []
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les produits'
    });
  }
});

// GET /api/products/:slug - Récupérer un produit par son slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const productQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      WHERE p.slug = ? AND p.status = 'active'
      GROUP BY p.id
    `;

    const products = await dbQuery(productQuery, [slug]);

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas ou n\'est plus disponible'
      });
    }

    const product = products[0];

    // Récupérer les images du produit
    const imagesQuery = `
      SELECT image_url, alt_text, sort_order, is_primary
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `;

    const images = await dbQuery(imagesQuery, [product.id]);

    // Récupérer les variantes
    const variantsQuery = `
      SELECT 
        pv.*,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id = ?
      GROUP BY pv.id
      ORDER BY pv.position ASC
    `;

    const variants = await dbQuery(variantsQuery, [product.id]);

    // Récupérer les options des variantes
    if (variants.length > 0) {
      const variantIds = variants.map(v => v.id);
      const optionsQuery = `
        SELECT variant_id, name, value
        FROM variant_options
        WHERE variant_id IN (${variantIds.map(() => '?').join(',')})
        ORDER BY variant_id, name
      `;

      const options = await dbQuery(optionsQuery, variantIds);

      // Grouper les options par variante
      const optionsByVariant = {};
      options.forEach(option => {
        if (!optionsByVariant[option.variant_id]) {
          optionsByVariant[option.variant_id] = [];
        }
        optionsByVariant[option.variant_id].push({
          name: option.name,
          value: option.value
        });
      });

      variants.forEach(variant => {
        variant.options = optionsByVariant[variant.id] || [];
        variant.price = parseFloat(variant.price);
        variant.compare_price = variant.compare_price ? parseFloat(variant.compare_price) : null;
        variant.inventory_quantity = parseInt(variant.inventory_quantity);
      });
    }

    // Récupérer les avis
    const reviewsQuery = `
      SELECT 
        pr.*,
        u.first_name,
        u.last_name
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND pr.is_approved = 1
      ORDER BY pr.created_at DESC
      LIMIT 10
    `;

    const reviews = await dbQuery(reviewsQuery, [product.id]);

    // Récupérer les produits similaires
    const similarQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
      GROUP BY p.id
      ORDER BY p.featured DESC, RAND()
      LIMIT 4
    `;

    const similarProducts = await dbQuery(similarQuery, [product.category_id, product.id]);

    // Formatage du produit
    const formattedProduct = {
      ...product,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      inventory_quantity: parseInt(product.inventory_quantity),
      images: images,
      variants: variants,
      reviews: reviews,
      similar_products: similarProducts.map(p => ({
        ...p,
        price: parseFloat(p.price),
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        inventory_quantity: parseInt(p.inventory_quantity),
        images: p.primary_image ? [p.primary_image] : []
      }))
    };

    res.json(formattedProduct);

  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le produit'
    });
  }
});

// GET /api/products/featured - Récupérer les produits mis en avant
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      WHERE p.featured = 1 AND p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const products = await dbQuery(query, [parseInt(limit)]);

    const formattedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      inventory_quantity: parseInt(product.inventory_quantity),
      images: product.primary_image ? [product.primary_image] : []
    }));

    res.json(formattedProducts);

  } catch (error) {
    console.error('Erreur lors de la récupération des produits mis en avant:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les produits mis en avant'
    });
  }
});

module.exports = router;
