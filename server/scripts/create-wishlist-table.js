// server/scripts/create-wishlist-table.js
// Crée la table `wishlist` (liens user <-> produit)
// Lancer : node server/scripts/create-wishlist-table.js

require('dotenv').config();
const { query } = require('../config/database');

(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_product (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Table wishlist créée (ou déjà existante)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur création table wishlist:', err);
    process.exit(1);
  }
})();
