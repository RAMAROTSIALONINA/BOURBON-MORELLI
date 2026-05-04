const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Middleware pour vérifier l'authentification admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

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

    // Requête pour récupérer les produits et toutes leurs images
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

    // Récupérer toutes les images pour chaque produit
    const formattedProducts = [];
    for (const product of products) {
      // Récupérer les images de ce produit
      const [images] = await connection.execute(`
        SELECT image_url 
        FROM product_images 
        WHERE product_id = ? 
        ORDER BY is_primary DESC
      `, [product.id]);
      
      const imageUrls = images.map(img => img.image_url);
      
      formattedProducts.push({
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
        images: imageUrls, // Toutes les images
        status: product.status,
        featured: Boolean(product.featured),
        stock: product.stock || 0,
        sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
        created_at: product.created_at
      });
    }

    await connection.end();

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
        stock: product.stock || 0,
        sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
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

// -----------------------------------------------------------
// Utilitaires de génération de slug / SKU uniques
// -----------------------------------------------------------
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST /api/products - Créer un nouveau produit
router.post('/', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { name, description, price, category, category_id, stock, status, images, image_url, sizes } = req.body;

    // Normaliser sizes en chaîne "S,M,L"
    const normalizedSizes = Array.isArray(sizes)
      ? sizes.map(s => String(s).trim()).filter(Boolean).join(',')
      : (typeof sizes === 'string' ? sizes.trim() : '');

    // Debug logs pour les images
    console.log('=== CRÉATION PRODUIT - DEBUG IMAGES ===');
    console.log('req.body.images:', images);
    console.log('req.body.image_url:', image_url);
    console.log('Type de images:', typeof images);
    console.log('Array.isArray(images):', Array.isArray(images));

    if (!name || !price) {
      return res.status(400).json({
        error   : 'Champs obligatoires manquants',
        message : 'Le nom et le prix sont requis'
      });
    }

    connection = await mysql.createConnection({
      host     : process.env.DB_HOST || 'localhost',
      user     : process.env.DB_USER || 'root',
      password : process.env.DB_PASSWORD || '',
      database : process.env.DB_NAME || 'bourbon_morelli',
      charset  : 'utf8mb4'
    });

    // ── Résoudre category_id ──────────────────────────────────
    let resolvedCategoryId = category_id ? parseInt(category_id) : null;
    if (!resolvedCategoryId && category) {
      // Accepte un nom de catégorie OU un ID numérique envoyé en string
      if (/^\d+$/.test(String(category))) {
        resolvedCategoryId = parseInt(category);
      } else {
        const [cats] = await connection.execute(
          'SELECT id FROM categories WHERE name = ? LIMIT 1',
          [category]
        );
        resolvedCategoryId = cats[0]?.id || null;
      }
    }

    // ── Générer un slug UNIQUE ────────────────────────────────
    let slug = slugify(name);
    if (!slug) slug = 'produit';
    const [existingSlugs] = await connection.execute(
      'SELECT id FROM products WHERE slug = ?',
      [slug]
    );
    if (existingSlugs.length > 0) {
      // Ajouter un suffixe aléatoire pour garantir l'unicité
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // ── Générer un SKU UNIQUE ─────────────────────────────────
    let sku = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const [existingSkus] = await connection.execute(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );
    if (existingSkus.length > 0) {
      sku = `${sku}-${Math.floor(Math.random() * 10000)}`;
    }

    // ── Créer le produit ──────────────────────────────────────
    const [result] = await connection.execute(`
      INSERT INTO products (name, description, price, category_id, status, slug, sku, sizes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name,
      description || '',
      parseFloat(price),
      resolvedCategoryId,
      status || 'active',
      slug,
      sku,
      normalizedSizes || null
    ]);

    const productId = result.insertId;

    // ── Ajouter le stock dans la table inventory ──────────────
    await connection.execute(`
      INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
      VALUES (?, ?, ?, ?)
    `, [productId, parseInt(stock) || 0, 0, 10]);

    // ── Ajouter les images si fournies ──────────────────────────
    const imagesToProcess = images || (image_url ? [image_url] : []);
    if (imagesToProcess.length > 0) {
      for (let i = 0; i < imagesToProcess.length; i++) {
        const imageUrl = imagesToProcess[i];
        const isPrimary = i === 0; // La première image est primaire
        await connection.execute(`
          INSERT INTO product_images (product_id, image_url, is_primary, alt_text, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [productId, imageUrl, isPrimary, isPrimary ? name : `${name} - Image ${i + 1}`]);
      }
    }

    await connection.end();

    res.status(201).json({
      success : true,
      message : 'Produit créé avec succès',
      product : {
        id          : productId,
        name,
        description,
        price       : parseFloat(price),
        category_id : resolvedCategoryId,
        slug,
        sku,
        stock       : parseInt(stock) || 0,
        status      : status || 'active',
        image_url,
        created_at  : new Date().toISOString()
      }
    });

  } catch (error) {
    if (connection) { try { await connection.end(); } catch (_) {} }
    console.error('Erreur création produit:', error);

    // Message clair en cas de doublon
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error   : 'Doublon',
        message : 'Un produit avec ce nom (ou ce SKU) existe déjà. Veuillez réessayer avec un nom différent.'
      });
    }

    res.status(500).json({
      error   : 'Erreur serveur',
      message : error.message
    });
  }
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, description, price, category, category_id, stock, status, images, image_url, sizes } = req.body;

    connection = await mysql.createConnection({
      host     : process.env.DB_HOST || 'localhost',
      user     : process.env.DB_USER || 'root',
      password : process.env.DB_PASSWORD || '',
      database : process.env.DB_NAME || 'bourbon_morelli',
      charset  : 'utf8mb4'
    });

    // ── Vérifier que le produit existe et récupérer le slug actuel ──
    const [products] = await connection.execute(
      'SELECT id, slug, name FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      await connection.end();
      return res.status(404).json({
        error   : 'Produit non trouvé',
        message : 'Ce produit n\'existe pas'
      });
    }

    const currentProduct = products[0];

    // ── Résoudre category_id (accepte nom texte OU id) ──────────────
    let resolvedCategoryId = null;
    if (category_id) {
      resolvedCategoryId = parseInt(category_id);
    } else if (category) {
      if (/^\d+$/.test(String(category))) {
        resolvedCategoryId = parseInt(category);
      } else {
        const [cats] = await connection.execute(
          'SELECT id FROM categories WHERE name = ? LIMIT 1',
          [category]
        );
        resolvedCategoryId = cats[0]?.id || null;
      }
    }

    // ── Régénérer le slug si le nom change ──────────────────────────
    let newSlug = currentProduct.slug;
    if (name && name !== currentProduct.name) {
      let candidate = slugify(name);
      if (!candidate) candidate = 'produit';
      // Vérifier unicité (sauf contre soi-même)
      const [existing] = await connection.execute(
        'SELECT id FROM products WHERE slug = ? AND id != ?',
        [candidate, id]
      );
      if (existing.length > 0) {
        candidate = `${candidate}-${Date.now().toString(36)}`;
      }
      newSlug = candidate;
    }

    // ── Construire le UPDATE dynamiquement pour ne toucher que les champs fournis ──
    const updates = ['updated_at = NOW()'];
    const params  = [];

    if (name !== undefined)        { updates.push('name = ?');          params.push(name); }
    if (description !== undefined) { updates.push('description = ?');   params.push(description || ''); }
    if (price !== undefined)       { updates.push('price = ?');         params.push(parseFloat(price)); }
    if (status !== undefined)      { updates.push('status = ?');        params.push(status || 'active'); }
    if (resolvedCategoryId !== null) { updates.push('category_id = ?'); params.push(resolvedCategoryId); }
    if (newSlug !== currentProduct.slug) { updates.push('slug = ?');    params.push(newSlug); }
    if (sizes !== undefined) {
      const normalizedSizes = Array.isArray(sizes)
        ? sizes.map(s => String(s).trim()).filter(Boolean).join(',')
        : (typeof sizes === 'string' ? sizes.trim() : '');
      updates.push('sizes = ?');
      params.push(normalizedSizes || null);
    }

    params.push(id);

    await connection.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // ── Mettre à jour le stock ──────────────────────────────────────
    if (stock !== undefined) {
      // S'assurer qu'une ligne inventory existe (peut manquer pour d'anciens produits)
      const [invRows] = await connection.execute(
        'SELECT id FROM inventory WHERE product_id = ? AND variant_id IS NULL',
        [id]
      );
      if (invRows.length > 0) {
        await connection.execute(
          'UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE product_id = ? AND variant_id IS NULL',
          [parseInt(stock) || 0, id]
        );
      } else {
        await connection.execute(
          'INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (?, ?, 0, 10)',
          [id, parseInt(stock) || 0]
        );
      }
    }

    // ── Mettre à jour les images si fournies
    const imagesToProcess = images || (image_url ? [image_url] : null);
    if (imagesToProcess) {
      // Supprimer les anciennes images
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
      
      // Ajouter les nouvelles images
      for (let i = 0; i < imagesToProcess.length; i++) {
        const imageUrl = imagesToProcess[i];
        const isPrimary = i === 0; // La première image est primaire
        await connection.execute(`
          INSERT INTO product_images (product_id, image_url, is_primary, alt_text, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [id, imageUrl, isPrimary, isPrimary ? (name || currentProduct.name) : `${name || currentProduct.name} - Image ${i + 1}`]);
      }
    }

    await connection.end();

    res.json({
      success : true,
      message : 'Produit mis à jour avec succès',
      product : {
        id          : parseInt(id),
        name,
        description,
        price       : parseFloat(price),
        slug        : newSlug,
        category_id : resolvedCategoryId,
        stock       : parseInt(stock) || 0,
        status      : status || 'active',
        image_url,
        updated_at  : new Date().toISOString()
      }
    });

  } catch (error) {
    if (connection) { try { await connection.end(); } catch (_) {} }
    console.error('Erreur mise à jour produit:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error   : 'Doublon',
        message : 'Un produit avec ces informations existe déjà.'
      });
    }

    res.status(500).json({
      error   : 'Erreur serveur',
      message : error.message
    });
  }
});

// DELETE /api/products/:id - Supprimer un produit
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Vérifier si le produit existe
    const [products] = await connection.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas'
      });
    }

    // Supprimer les images du produit
    await connection.execute(
      'DELETE FROM product_images WHERE product_id = ?',
      [id]
    );

    // Supprimer le produit
    await connection.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// GET /api/products?category=... - Filtrer par catégorie
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
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        COALESCE(i.quantity, 0) as stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'active' AND c.name = ?
      ORDER BY p.created_at DESC
    `, [categoryName]);

    await connection.end();

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
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
      sizes: product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
      created_at: product.created_at
    }));

    res.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length
    });

  } catch (error) {
    console.error('Erreur produits par catégorie:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

module.exports = router;
