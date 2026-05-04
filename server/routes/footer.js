const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bourbon_morelli',
  charset: 'utf8mb4'
};

// Fonction pour créer une connexion à la base de données
async function createConnection() {
  return await mysql.createConnection(dbConfig);
}

// GET /api/admin/footer - Récupérer tous les paramètres du footer
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM footer_settings ORDER BY section, display_order'
    );
    
    // Grouper les résultats par section
    const groupedData = {};
    rows.forEach(row => {
      if (!groupedData[row.section]) {
        groupedData[row.section] = [];
      }
      groupedData[row.section].push({
        id: row.id,
        key_name: row.key_name,
        value: row.content_type === 'feature' ? JSON.parse(row.value) : row.value,
        label: row.label,
        content_type: row.content_type,
        display_order: row.display_order,
        is_active: row.is_active
      });
    });
    
    res.json({
      success: true,
      data: groupedData
    });
    
  } catch (error) {
    console.error('Erreur récupération footer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres du footer'
    });
  } finally {
    if (connection) await connection.end();
  }
});

// GET /api/admin/footer/sections - Récupérer les sections disponibles
router.get('/sections', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT DISTINCT section FROM footer_settings ORDER BY section'
    );
    
    const sections = rows.map(row => row.section);
    
    res.json({
      success: true,
      data: sections
    });
    
  } catch (error) {
    console.error('Erreur récupération sections:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sections'
    });
  } finally {
    if (connection) await connection.end();
  }
});

// PUT /api/admin/footer/:id - Mettre à jour un paramètre du footer
router.put('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { value, is_active } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }
    
    connection = await createConnection();
    
    // Récupérer d'abord le type de contenu pour savoir si on doit parser/stringifier
    const [existing] = await connection.execute(
      'SELECT content_type FROM footer_settings WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }
    
    const contentType = existing[0].content_type;
    const finalValue = contentType === 'feature' && typeof value === 'object' 
      ? JSON.stringify(value) 
      : value;
    
    // Mettre à jour le paramètre
    await connection.execute(
      'UPDATE footer_settings SET value = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [finalValue, is_active !== undefined ? is_active : true, id]
    );
    
    res.json({
      success: true,
      message: 'Paramètre mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur mise à jour footer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paramètre'
    });
  } finally {
    if (connection) await connection.end();
  }
});

// POST /api/admin/footer - Ajouter un nouveau paramètre
router.post('/', async (req, res) => {
  let connection;
  try {
    const { section, content_type, key_name, value, label, display_order = 0, is_active = true } = req.body;
    
    if (!section || !content_type || !key_name || !label) {
      return res.status(400).json({
        success: false,
        message: 'Les champs section, content_type, key_name et label sont requis'
      });
    }
    
    connection = await createConnection();
    
    const finalValue = content_type === 'feature' && typeof value === 'object' 
      ? JSON.stringify(value) 
      : value;
    
    await connection.execute(
      'INSERT INTO footer_settings (section, content_type, key_name, value, label, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [section, content_type, key_name, finalValue, label, display_order, is_active]
    );
    
    res.status(201).json({
      success: true,
      message: 'Paramètre ajouté avec succès'
    });
    
  } catch (error) {
    console.error('Erreur ajout footer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: 'Ce clé existe déjà pour cette section'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du paramètre'
      });
    }
  } finally {
    if (connection) await connection.end();
  }
});

// DELETE /api/admin/footer/:id - Supprimer un paramètre
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await createConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM footer_settings WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Paramètre supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression footer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du paramètre'
    });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
