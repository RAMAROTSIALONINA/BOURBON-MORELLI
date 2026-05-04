const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bourbon_morelli',
  charset: 'utf8mb4'
};

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const parseValue = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

// GET /api/site-settings/:key  (public)
router.get('/:key', async (req, res) => {
  let connection;
  try {
    const { key } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT value, updated_at FROM site_settings WHERE setting_key = ?',
      [key]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paramètre introuvable' });
    }
    res.json({
      success: true,
      key,
      value: parseValue(rows[0].value),
      updated_at: rows[0].updated_at
    });
  } catch (err) {
    console.error('Erreur GET site_settings:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// PUT /api/site-settings/:key  (admin)
router.put('/:key', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { key } = req.params;
    const value = req.body?.value;
    if (value === undefined) {
      return res.status(400).json({ success: false, message: "Le champ 'value' est requis" });
    }
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO site_settings (setting_key, value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
      [key, serialized]
    );
    res.json({ success: true, key, value: parseValue(serialized) });
  } catch (err) {
    console.error('Erreur PUT site_settings:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
