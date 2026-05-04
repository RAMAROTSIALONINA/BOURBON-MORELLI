const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

// POST /api/contact - Soumettre un message de contact (public)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Le nom doit contenir entre 2 et 150 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('subject').trim().isLength({ min: 2, max: 100 }).withMessage('Le sujet est requis'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Le message doit contenir entre 10 et 5000 caractères')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().slice(0, 45);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255);

    const result = await query(
      `INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [name, email, subject, message, ip, userAgent]
    );

    res.status(201).json({
      message: 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur envoi message contact:', error.message);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible d\'envoyer le message. Veuillez réessayer.'
    });
  }
});

// ========== ROUTES ADMIN ==========

// GET /api/contact/admin - Lister tous les messages (admin)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const messages = await query(
      `SELECT id, name, email, subject, message, status, admin_notes, created_at, updated_at
       FROM contact_messages
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM contact_messages ${whereClause}`,
      params
    );

    res.json({
      messages,
      pagination: {
        current_page: page,
        per_page: limit,
        total: countRow.total,
        total_pages: Math.ceil(countRow.total / limit),
        has_next: page * limit < countRow.total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur liste messages contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de récupérer les messages' });
  }
});

// GET /api/contact/admin/stats - Stats rapides
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'new') AS new_count,
        SUM(status = 'read') AS read_count,
        SUM(status = 'replied') AS replied_count,
        SUM(status = 'archived') AS archived_count,
        SUM(DATE(created_at) = CURDATE()) AS today_count
      FROM contact_messages
    `);
    res.json({ stats: rows[0] });
  } catch (error) {
    console.error('Erreur stats contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/contact/admin/:id - Détail d'un message
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const rows = await query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Marquer automatiquement comme 'read' si 'new'
    if (rows[0].status === 'new') {
      await query("UPDATE contact_messages SET status = 'read' WHERE id = ?", [id]);
      rows[0].status = 'read';
    }

    res.json({ message: rows[0] });
  } catch (error) {
    console.error('Erreur détail message contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/contact/admin/:id - Mettre à jour statut / notes
router.patch('/admin/:id', authenticateToken, requireAdmin, [
  body('status').optional().isIn(['new', 'read', 'replied', 'archived']),
  body('admin_notes').optional().isString().isLength({ max: 5000 })
], handleValidationErrors, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const { status, admin_notes } = req.body;
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification' });
    }

    params.push(id);
    await query(`UPDATE contact_messages SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (!updated) return res.status(404).json({ error: 'Message non trouvé' });

    res.json({ message: 'Message mis à jour', data: updated });
  } catch (error) {
    console.error('Erreur mise à jour message contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contact/admin/:id/reply - Envoyer une réponse par email
router.post('/admin/:id/reply', authenticateToken, requireAdmin, [
  body('replyText').trim().isLength({ min: 5, max: 5000 }).withMessage('La réponse doit contenir entre 5 et 5000 caractères')
], handleValidationErrors, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const rows = await query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Message non trouvé' });

    const msg = rows[0];
    const { replyText } = req.body;
    const { sendContactReplyEmail } = require('../services/emailService');

    const result = await sendContactReplyEmail(msg.email, {
      recipientName: msg.name,
      originalSubject: msg.subject,
      originalMessage: msg.message,
      replyText
    });

    // Marquer comme répondu
    await query("UPDATE contact_messages SET status = 'replied' WHERE id = ?", [id]);

    res.json({ success: true, emailSent: result.sent !== false, message: 'Réponse envoyée' });
  } catch (error) {
    console.error('Erreur réponse message contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible d\'envoyer la réponse' });
  }
});

// DELETE /api/contact/admin/:id - Supprimer un message
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const rows = await query('SELECT id FROM contact_messages WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Message non trouvé' });

    await query('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression message contact:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
