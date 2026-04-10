const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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

// GET /api/cart - Récupérer le panier de l'utilisateur
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];
    
    let cart;
    
    if (userId) {
      // Utilisateur connecté : récupérer son panier
      const carts = await query(
        'SELECT * FROM carts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [userId]
      );
      
      if (carts.length === 0) {
        return res.json({
          items: [],
          subtotal: 0,
          total_items: 0
        });
      }
      
      cart = carts[0];
    } else {
      // Utilisateur anonyme : utiliser la session
      if (!sessionId) {
        return res.json({
          items: [],
          subtotal: 0,
          total_items: 0
        });
      }
      
      const carts = await query(
        'SELECT * FROM carts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1',
        [sessionId]
      );
      
      if (carts.length === 0) {
        return res.json({
          items: [],
          subtotal: 0,
          total_items: 0
        });
      }
      
      cart = carts[0];
    }

    // Récupérer les articles du panier
    const cartItemsQuery = `
      SELECT 
        ci.*,
        p.name,
        p.slug,
        p.price,
        p.compare_price,
        p.description,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url,
        pv.name as variant_name,
        pv.sku as variant_sku,
        c.name as category_name
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `;

    const cartItems = await query(cartItemsQuery, [cart.id]);

    // Calculer le sous-total
    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        slug: item.slug,
        price: parseFloat(item.price),
        compare_price: item.compare_price ? parseFloat(item.compare_price) : null,
        quantity: item.quantity,
        image_url: item.image_url,
        variant_name: item.variant_name,
        variant_sku: item.variant_sku,
        category_name: item.category_name,
        total: itemTotal
      };
    });

    res.json({
      items: formattedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      total_items: totalItems,
      cart_id: cart.id
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le panier'
    });
  }
});

// POST /api/cart/add - Ajouter un produit au panier
router.post('/add', optionalAuth, [
  body('product_id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('variant_id').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];
    const { product_id, quantity, variant_id } = req.body;

    // Vérifier si le produit existe et est en stock
    let productQuery;
    let queryParams;

    if (variant_id) {
      productQuery = `
        SELECT 
          p.*, 
          pv.name as variant_name,
          pv.sku as variant_sku,
          COALESCE(SUM(i.quantity), 0) as inventory_quantity
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN inventory i ON (pv.id = i.variant_id)
        WHERE p.id = ? AND pv.id = ? AND p.status = 'active'
        GROUP BY p.id, pv.id
      `;
      queryParams = [product_id, variant_id];
    } else {
      productQuery = `
        SELECT 
          p.*,
          COALESCE(SUM(i.quantity), 0) as inventory_quantity
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
        WHERE p.id = ? AND p.status = 'active'
        GROUP BY p.id
      `;
      queryParams = [product_id];
    }

    const products = await query(productQuery, queryParams);

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas ou n\'est plus disponible'
      });
    }

    const product = products[0];

    // Vérifier le stock
    if (product.inventory_quantity < quantity) {
      return res.status(400).json({
        error: 'Stock insuffisant',
        message: `Seulement ${product.inventory_quantity} unité(s) disponible(s)`
      });
    }

    // Récupérer ou créer le panier
    let cart;
    
    if (userId) {
      // Utilisateur connecté
      const carts = await query(
        'SELECT * FROM carts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [userId]
      );
      
      if (carts.length === 0) {
        const result = await query(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cart = { id: result.insertId };
      } else {
        cart = carts[0];
      }
    } else {
      // Utilisateur anonyme
      if (!sessionId) {
        return res.status(400).json({
          error: 'Session requise',
          message: 'Session ID requis pour les utilisateurs anonymes'
        });
      }
      
      const carts = await query(
        'SELECT * FROM carts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1',
        [sessionId]
      );
      
      if (carts.length === 0) {
        const result = await query(
          'INSERT INTO carts (session_id) VALUES (?)',
          [sessionId]
        );
        cart = { id: result.insertId };
      } else {
        cart = carts[0];
      }
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItems = await query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
      [cart.id, product_id, variant_id || null]
    );

    if (existingItems.length > 0) {
      // Mettre à jour la quantité
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (product.inventory_quantity < newQuantity) {
        return res.status(400).json({
          error: 'Stock insuffisant',
          message: `Seulement ${product.inventory_quantity} unité(s) disponible(s) au total`
        });
      }

      await query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Ajouter un nouvel article
      await query(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        [cart.id, product_id, variant_id || null, quantity]
      );
    }

    // Mettre à jour la date de modification du panier
    await query(
      'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cart.id]
    );

    res.json({
      message: 'Produit ajouté au panier avec succès',
      cart_id: cart.id
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible d\'ajouter le produit au panier'
    });
  }
});

// PUT /api/cart/update/:itemId - Mettre à jour la quantité d'un article
router.put('/update/:itemId', optionalAuth, [
  body('quantity').isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Vérifier que l'article appartient bien au panier de l'utilisateur
    let cartCheckQuery;
    let cartCheckParams;

    if (userId) {
      cartCheckQuery = `
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ? AND c.user_id = ?
      `;
      cartCheckParams = [itemId, userId];
    } else {
      cartCheckQuery = `
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ? AND c.session_id = ?
      `;
      cartCheckParams = [itemId, sessionId];
    }

    const cartItems = await query(cartCheckQuery, cartCheckParams);

    if (cartItems.length === 0) {
      return res.status(404).json({
        error: 'Article non trouvé',
        message: 'Cet article n\'existe pas dans votre panier'
      });
    }

    const cartItem = cartItems[0];

    // Vérifier le stock
    let stockQuery;
    let stockParams;

    if (cartItem.variant_id) {
      stockQuery = `
        SELECT COALESCE(SUM(i.quantity), 0) as inventory_quantity
        FROM product_variants pv
        LEFT JOIN inventory i ON pv.id = i.variant_id
        WHERE pv.id = ?
      `;
      stockParams = [cartItem.variant_id];
    } else {
      stockQuery = `
        SELECT COALESCE(SUM(i.quantity), 0) as inventory_quantity
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
        WHERE p.id = ?
      `;
      stockParams = [cartItem.product_id];
    }

    const stockResult = await query(stockQuery, stockParams);
    const availableStock = stockResult[0].inventory_quantity;

    if (availableStock < quantity) {
      return res.status(400).json({
        error: 'Stock insuffisant',
        message: `Seulement ${availableStock} unité(s) disponible(s)`
      });
    }

    // Mettre à jour la quantité
    await query(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, itemId]
    );

    res.json({
      message: 'Quantité mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du panier:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour la quantité'
    });
  }
});

// DELETE /api/cart/remove/:itemId - Supprimer un article du panier
router.delete('/remove/:itemId', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];
    const { itemId } = req.params;

    // Vérifier que l'article appartient bien au panier de l'utilisateur
    let cartCheckQuery;
    let cartCheckParams;

    if (userId) {
      cartCheckQuery = `
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ? AND c.user_id = ?
      `;
      cartCheckParams = [itemId, userId];
    } else {
      cartCheckQuery = `
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ? AND c.session_id = ?
      `;
      cartCheckParams = [itemId, sessionId];
    }

    const cartItems = await query(cartCheckQuery, cartCheckParams);

    if (cartItems.length === 0) {
      return res.status(404).json({
        error: 'Article non trouvé',
        message: 'Cet article n\'existe pas dans votre panier'
      });
    }

    // Supprimer l'article
    await query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    res.json({
      message: 'Article supprimé du panier avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du panier:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de supprimer l\'article du panier'
    });
  }
});

// DELETE /api/cart/clear - Vider le panier
router.delete('/clear', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    let cartQuery;
    let cartParams;

    if (userId) {
      cartQuery = 'SELECT id FROM carts WHERE user_id = ?';
      cartParams = [userId];
    } else {
      cartQuery = 'SELECT id FROM carts WHERE session_id = ?';
      cartParams = [sessionId];
    }

    const carts = await query(cartQuery, cartParams);

    if (carts.length > 0) {
      // Supprimer tous les articles du panier
      await query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
    }

    res.json({
      message: 'Panier vidé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du vidage du panier:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de vider le panier'
    });
  }
});

module.exports = router;
