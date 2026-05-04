const mysql = require('mysql2/promise');
require('dotenv').config();

async function createContactMessagesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('Vérification de la table contact_messages...');

    const [tables] = await connection.execute("SHOW TABLES LIKE 'contact_messages'");

    if (tables.length === 0) {
      console.log('Création de la table contact_messages...');
      await connection.execute(`
        CREATE TABLE contact_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          email VARCHAR(190) NOT NULL,
          subject VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
          admin_notes TEXT NULL,
          ip_address VARCHAR(45) NULL,
          user_agent VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table contact_messages créée avec succès !');
    } else {
      console.log('ℹ️  La table contact_messages existe déjà.');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createContactMessagesTable();
