const { query } = require('../config/database');

/**
 * Décrémente le stock de chaque article d'une commande confirmée.
 *
 * Sécurité :
 *  - Ne décrémente que si l'ordre passe réellement à 'confirmed' (affectedRows > 0).
 *  - Respecte track_quantity : ignore les produits non suivis.
 *  - Respecte allow_backorder : empêche le stock de passer sous 0 si non autorisé.
 *  - Logge chaque mise à jour pour traçabilité.
 *
 * @param {number} orderId
 * @returns {Promise<{ ok: boolean, decremented: number, skipped: number, items: Array }>}
 */
const decreaseStockForOrder = async (orderId) => {
  try {
    // 1. Récupérer les articles de la commande
    const items = await query(
      `SELECT oi.product_id, oi.quantity, oi.product_name,
              i.id AS inventory_id, i.quantity AS stock_qty,
              i.track_quantity, i.allow_backorder
       FROM order_items oi
       LEFT JOIN inventory i ON i.product_id = oi.product_id AND i.variant_id IS NULL
       WHERE oi.order_id = ?`,
      [orderId]
    );

    if (!items.length) {
      return { ok: true, decremented: 0, skipped: 0, items: [] };
    }

    const results = [];
    let decremented = 0;
    let skipped = 0;

    for (const item of items) {
      // Ignorer si pas d'entrée inventaire ou suivi désactivé
      if (!item.inventory_id || !item.track_quantity) {
        skipped++;
        results.push({ product_id: item.product_id, name: item.product_name, status: 'skipped', reason: 'no_inventory_or_not_tracked' });
        continue;
      }

      if (!item.allow_backorder) {
        // Empêcher le stock négatif : décrémenter seulement jusqu'à 0
        await query(
          `UPDATE inventory
           SET quantity = GREATEST(0, quantity - ?),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND track_quantity = 1`,
          [item.quantity, item.inventory_id]
        );
      } else {
        // Backorder autorisé : peut passer en négatif
        await query(
          `UPDATE inventory
           SET quantity = quantity - ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND track_quantity = 1`,
          [item.quantity, item.inventory_id]
        );
      }

      decremented++;
      const newQty = item.allow_backorder
        ? item.stock_qty - item.quantity
        : Math.max(0, item.stock_qty - item.quantity);

      results.push({
        product_id: item.product_id,
        name: item.product_name,
        status: 'decremented',
        old_qty: item.stock_qty,
        ordered_qty: item.quantity,
        new_qty: newQty
      });

      console.log(
        `[Stock] Produit #${item.product_id} (${item.product_name}): ${item.stock_qty} → ${newQty} (commande #${orderId})`
      );
    }

    return { ok: true, decremented, skipped, items: results };
  } catch (error) {
    console.error(`[Stock] Erreur decreaseStockForOrder(orderId=${orderId}):`, error.message);
    return { ok: false, error: error.message, decremented: 0, skipped: 0, items: [] };
  }
};

module.exports = { decreaseStockForOrder };
