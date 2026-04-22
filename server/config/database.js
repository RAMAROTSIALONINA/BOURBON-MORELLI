const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bourbon_morelli',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données MySQL établie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

// Fonction pour exécuter des requêtes
async function query(sql, params = []) {
  try {
    // Filtrer et valider les paramètres pour éviter les erreurs SQL
    const filteredParams = params.map(param => {
      if (param === undefined) {
        return null;
      }
      // S'assurer que les nombres sont bien des nombres
      if (typeof param === 'string' && !isNaN(param) && param.trim() !== '') {
        return parseInt(param, 10);
      }
      return param;
    });
    
    console.log('SQL:', sql);
    console.log('Params:', filteredParams);
    
    const [rows] = await pool.execute(sql, filteredParams);
    return rows;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    console.error('SQL Query:', sql);
    console.error('Parameters:', params);
    throw error;
  }
}

// Fonction pour exécuter une transaction
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
