const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function createManualToken() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== CRÉATION TOKEN MANUEL ===\n');

    // Récupérer l'utilisateur admin
    const [adminUsers] = await connection.execute(`
      SELECT id, email, role FROM users WHERE email = ? AND role = 'admin'
    `, ['tsialoninajeanedouard@gmail.com']);

    if (adminUsers.length === 0) {
      console.log('Utilisateur admin non trouvé');
      return;
    }

    const adminUser = adminUsers[0];
    console.log('Utilisateur admin trouvé:');
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Rôle: ${adminUser.role}`);

    // Créer un token JWT manuellement
    const payload = {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = '24h'; // 24 heures

    const token = jwt.sign(payload, secret, { expiresIn });

    console.log('\n=== TOKEN CRÉÉ MANUELLEMENT ===');
    console.log('Token complet:', token);
    console.log('==============================\n');

    console.log('Instructions:');
    console.log('1. Ouvrez les outils de développement du navigateur (F12)');
    console.log('2. Allez dans l\'onglet Console');
    console.log('3. Exécutez: localStorage.setItem("adminToken", "' + token + '")');
    console.log('4. Rafraîchissez la page d\'administration');
    console.log('5. Essayez d\'uploader une image');

    await connection.end();
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

createManualToken();
