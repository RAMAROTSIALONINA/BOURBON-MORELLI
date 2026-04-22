const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Middleware auth admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Helper slug
const slugify = (str) =>
  (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
      LIMIT ${parseInt(limit) || 20} OFFSET ${parseInt(offset) || 0}
    `;

    const products = await query(productsQuery, [category.id]);

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

// POST /api/categories - Créer une catégorie (admin)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description = null, image_url = null, parent_id = null, sort_order = 0 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }
    const slug = slugify(name);
    // Vérifier unicité du slug
    const existing = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Une catégorie avec ce nom existe déjà' });
    }
    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [name.trim(), slug, description, image_url, parent_id, sort_order]
    );
    const [created] = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, category: created });
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de créer la catégorie' });
  }
});

// PUT /api/categories/:id - Modifier une catégorie (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, parent_id, sort_order, is_active } = req.body;

    const existing = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const updatedName = name ?? existing[0].name;
    const updatedSlug = name ? slugify(name) : existing[0].slug;

    // Vérifier unicité du slug si changement
    if (updatedSlug !== existing[0].slug) {
      const dup = await query('SELECT id FROM categories WHERE slug = ? AND id <> ?', [updatedSlug, id]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Une autre catégorie utilise déjà ce nom' });
      }
    }

    await query(
      `UPDATE categories
       SET name = ?, slug = ?, description = ?, image_url = ?, parent_id = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedSlug,
        description ?? existing[0].description,
        image_url ?? existing[0].image_url,
        parent_id ?? existing[0].parent_id,
        sort_order ?? existing[0].sort_order,
        typeof is_active === 'boolean' ? (is_active ? 1 : 0) : existing[0].is_active,
        id
      ]
    );
    const [updated] = await query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ success: true, category: updated });
  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de modifier la catégorie' });
  }
});

// DELETE /api/categories/:id - Supprimer une catégorie (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    // Vérifier s'il y a des produits liés
    const products = await query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (products[0].count > 0) {
      return res.status(400).json({
        error: 'Catégorie utilisée',
        message: `Impossible de supprimer : ${products[0].count} produit(s) utilisent cette catégorie.`
      });
    }
    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de supprimer la catégorie' });
  }
});

module.exports = router;
