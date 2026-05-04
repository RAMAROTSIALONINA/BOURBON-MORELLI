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

// GET /api/public/footer - Récupérer les données du footer pour le client
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM footer_settings WHERE is_active = TRUE ORDER BY section, display_order'
    );
    
    // Grouper les résultats par section
    const footerData = {};
    rows.forEach(row => {
      if (!footerData[row.section]) {
        footerData[row.section] = [];
      }
      
      // Parser la valeur si c'est un feature
      const value = row.content_type === 'feature' ? JSON.parse(row.value) : row.value;
      
      footerData[row.section].push({
        key_name: row.key_name,
        value: value,
        label: row.label,
        content_type: row.content_type
      });
    });
    
    res.json({
      success: true,
      data: footerData
    });
    
  } catch (error) {
    console.error('Erreur récupération footer public:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du footer'
    });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
