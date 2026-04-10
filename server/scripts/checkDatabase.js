const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bourbon_morelli'
    });

    console.log('Vérification de la base de données...');
    
    // Vérifier si la table users existe
    const [tables] = await connection.execute('SHOW TABLES');
    const usersTableExists = tables.some(table => table[0] === 'users');
    
    if (!usersTableExists) {
      console.log('La table users n\'existe pas. Création des tables...');
      await createTables(connection);
    } else {
      console.log('La table users existe. Vérification des colonnes...');
      await checkColumns(connection);
    }
    
    // Vérifier s'il y a des utilisateurs
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Nombre d'utilisateurs dans la base: ${userCount[0].count}`);
    
    if (userCount[0].count === 0) {
      console.log('Aucun utilisateur trouvé. Création d\'utilisateurs de test...');
      await createTestUsers(connection);
    } else {
      console.log('Utilisateurs trouvés. Affichage des 3 premiers:');
      const [users] = await connection.execute('SELECT id, first_name, last_name, email, role, status FROM users LIMIT 3');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Nom: ${user.first_name} ${user.last_name}, Email: ${user.email}, Rôle: ${user.role}, Statut: ${user.status}`);
      });
    }
    
    await connection.end();
    console.log('Base de données vérifiée avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('La base de données MySQL n\'est pas démarrée. Veuillez démarrer MySQL.');
    } else {
      console.error('Erreur MySQL:', error.message);
    }
  }
}

async function createTables(connection) {
  console.log('Création des tables...');
  
  // Table users
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      password VARCHAR(255) NOT NULL,
      role ENUM('client', 'admin') DEFAULT 'client',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  // Table addresses
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log('Tables créées avec succès!');
}

async function checkColumns(connection) {
  const [columns] = await connection.execute('DESCRIBE users');
  console.log('Colonnes de la table users:');
  columns.forEach(column => {
    console.log(`- ${column.Field}: ${column.Type}`);
  });
}

async function createTestUsers(connection) {
  console.log('Création d\'utilisateurs de test...');
  const bcrypt = require('bcryptjs');
  
  const testUsers = [
    {
      first_name: 'Admin',
      last_name: 'Test',
      email: 'admin@bourbonmorelli.com',
      phone: '+33 6 12 34 56 78',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    },
    {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      password: 'client123',
      role: 'client',
      status: 'active'
    },
    {
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'marie.martin@email.com',
      phone: '+33 6 23 45 67 89',
      password: 'client123',
      role: 'client',
      status: 'active'
    }
  ];
  
  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, phone, password, role, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.first_name, user.last_name, user.email, user.phone, hashedPassword, user.role, user.status]);
    console.log(`Utilisateur créé: ${user.first_name} ${user.last_name} (${user.email})`);
  }
  
  console.log('Utilisateurs de test créés avec succès!');
}

checkDatabase();
