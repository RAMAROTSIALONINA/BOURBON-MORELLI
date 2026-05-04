// server/routes/wishlist.js
// Wishlist : CRUD utilisateur (liaison user <-> product)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/wishlist - Liste de la wishlist de l'utilisateur (join products)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      `SELECT
         w.id              AS wishlist_id,
         w.created_at      AS added_at,
         p.id              AS id,
         p.name,
         p.slug,
         p.price,
         p.compare_price,
         p.brand,
         COALESCE((SELECT SUM(quantity) FROM inventory WHERE product_id = p.id), 0) AS stock,
         (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image,
         (SELECT GROUP_CONCAT(image_url ORDER BY is_primary DESC, id ASC SEPARATOR '|')
            FROM product_images WHERE product_id = p.id) AS images
       FROM wishlist w
       INNER JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    const items = rows.map(r => ({
      ...r,
      images: r.images ? r.images.split('|') : []
    }));

    res.json({ items, total: items.length });
  } catch (err) {
    console.error('Erreur GET /wishlist:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/wishlist - Ajouter un produit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id requis' });

    // Vérifie le produit
    const prod = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [product_id]);
    if (prod.length === 0) return res.status(404).json({ error: 'Produit introuvable' });

    // Insert (ignore si déjà présent grâce à UNIQUE)
    await query(
      `INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [userId, product_id]
    );

    res.status(201).json({ message: 'Ajouté à la wishlist' });
  } catch (err) {
    console.error('Erreur POST /wishlist:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/wishlist/:product_id - Retirer un produit
router.delete('/:product_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.product_id;
    const result = await query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    res.json({ message: 'Retiré', deleted: result.affectedRows || 0 });
  } catch (err) {
    console.error('Erreur DELETE /wishlist:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/wishlist - Vider la wishlist
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await query('DELETE FROM wishlist WHERE user_id = ?', [userId]);
    res.json({ message: 'Wishlist vidée' });
  } catch (err) {
    console.error('Erreur DELETE /wishlist (all):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
