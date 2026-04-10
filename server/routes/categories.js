const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /api/categories - Récupérer toutes les catégories actives
router.get('/', async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count,
        (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.is_active = 1) as subcategory_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const categories = await query(categoriesQuery);

    // Récupérer les sous-catégories pour chaque catégorie
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        if (category.subcategory_count > 0) {
          const subcategoriesQuery = `
            SELECT 
              sc.*,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = sc.id AND p.status = 'active') as product_count
            FROM categories sc
            WHERE sc.parent_id = ? AND sc.is_active = 1
            ORDER BY sc.sort_order ASC, sc.name ASC
          `;

          const subcategories = await query(subcategoriesQuery, [category.id]);
          return { ...category, subcategories };
        }
        return { ...category, subcategories: [] };
      })
    );

    res.json(categoriesWithSubcategories);

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les catégories'
    });
  }
});

// GET /api/categories/:slug - Récupérer une catégorie par son slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const categoryQuery = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count,
        (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.is_active = 1) as subcategory_count
      FROM categories c
      WHERE c.slug = ? AND c.is_active = 1
    `;

    const categories = await query(categoryQuery, [slug]);

    if (categories.length === 0) {
      return res.status(404).json({
        error: 'Catégorie non trouvée',
        message: 'Cette catégorie n\'existe pas ou n\'est plus active'
      });
    }

    const category = categories[0];

    // Récupérer les sous-catégories
    let subcategories = [];
    if (category.subcategory_count > 0) {
      const subcategoriesQuery = `
        SELECT 
          sc.*,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = sc.id AND p.status = 'active') as product_count
        FROM categories sc
        WHERE sc.parent_id = ? AND sc.is_active = 1
        ORDER BY sc.sort_order ASC, sc.name ASC
      `;

      subcategories = await query(subcategoriesQuery, [category.id]);
    }

    // Récupérer les produits de la catégorie (pagination)
    const { page = 1, limit = 20, sort = 'featured' } = req.query;
    const offset = (page - 1) * limit;

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
    }

    const productsQuery = `
      SELECT 
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as reviews_count,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      WHERE p.category_id = ? AND p.status = 'active'
      GROUP BY p.id
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = await query(productsQuery, [category.id, parseInt(limit), parseInt(offset)]);

    // Comptage total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.category_id = ? AND p.status = 'active'
    `;

    const countResult = await query(countQuery, [category.id]);
    const total = countResult[0].total;

    // Formatage des produits
    const formattedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      rating: product.rating ? parseFloat(product.rating) : null,
      inventory_quantity: parseInt(product.inventory_quantity),
      images: product.primary_image ? [product.primary_image] : []
    }));

    const response = {
      ...category,
      subcategories,
      products: {
        data: formattedProducts,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: total,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer la catégorie'
    });
  }
});

// GET /api/categories/tree - Récupérer l'arborescence complète des catégories
router.get('/tree/all', async (req, res) => {
  try {
    // Récupérer toutes les catégories actives
    const allCategoriesQuery = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const allCategories = await query(allCategoriesQuery);

    // Construire l'arborescence
    const categories = allCategories.filter(cat => !cat.parent_id);
    const subcategories = allCategories.filter(cat => cat.parent_id);

    const tree = categories.map(category => {
      const categorySubcategories = subcategories.filter(sub => sub.parent_id === category.id);
      return {
        ...category,
        subcategories: categorySubcategories
      };
    });

    res.json(tree);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'arborescence:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer l\'arborescence des catégories'
    });
  }
});

module.exports = router;
