// ============================================================
// routes/upload.js
// Endpoint pour uploader des images de produits
// POST /api/upload/image  (admin uniquement)
// Retourne : { url: "/uploads/products/<filename>" }
// ============================================================

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');

// ----------------------------------------------------------------
// Middleware d'authentification admin (cohérent avec products_simple.js)
// ----------------------------------------------------------------
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });

  try {
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

// ----------------------------------------------------------------
// Configuration multer : disque local, dossier uploads/products/
// ----------------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename   : (req, file, cb) => {
    // Générer un nom unique : prod-<timestamp>-<random>.<ext>
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = `prod-${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  }
});

// Filtrer les types de fichiers (images uniquement)
const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp|svg)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé (JPG, PNG, GIF, WEBP, SVG uniquement)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

// ----------------------------------------------------------------
// POST /api/upload/image
// Champ attendu : multipart/form-data, clé "image"
// ----------------------------------------------------------------
router.post('/image', authenticateAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Erreur upload image:', err);
      return res.status(400).json({
        error   : 'Échec de l\'upload',
        message : err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error   : 'Aucun fichier reçu',
        message : 'Le champ "image" est manquant dans la requête'
      });
    }

    // URL publique (servie par app.use('/uploads', express.static(...)))
    const publicUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      success  : true,
      url      : publicUrl,
      filename : req.file.filename,
      size     : req.file.size,
      mimetype : req.file.mimetype
    });
  });
});

module.exports = router;
