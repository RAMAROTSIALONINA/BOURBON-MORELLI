/**
 * Script de configuration du compte administrateur
 * Usage: node setup-admin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bourbon_morelli',
  charset: 'utf8mb4'
};

const ADMIN_EMAIL    = 'admin@bourbon-morelli.com';
const ADMIN_PASSWORD = 'Admin@2024!';
const ADMIN_FNAME    = 'Admin';
const ADMIN_LNAME    = 'Bourbon Morelli';

async function main() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('✅ Connecté à la base de données\n');

  try {
    // Lister tous les utilisateurs existants
    const [users] = await conn.execute(
      'SELECT id, first_name, last_name, email, role FROM users ORDER BY id'
    );

    if (users.length > 0) {
      console.log('📋 Utilisateurs existants :');
      users.forEach(u =>
        console.log(`  [${u.id}] ${u.email}  rôle: ${u.role}`)
      );
      console.log('');
    }

    // Vérifier si un admin existe déjà
    const [admins] = await conn.execute(
      "SELECT id, email FROM users WHERE role = 'admin'"
    );

    if (admins.length > 0) {
      console.log('ℹ️  Un compte admin existe déjà :');
      admins.forEach(a => console.log(`  → ${a.email}`));
      console.log('\n✅ Aucune action requise.');
      return;
    }

    // Vérifier si l'email admin existe (rôle customer)
    const [existing] = await conn.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      // Promouvoir l'utilisateur existant en admin
      await conn.execute(
        "UPDATE users SET role = 'admin' WHERE email = ?",
        [ADMIN_EMAIL]
      );
      console.log(`✅ Utilisateur "${ADMIN_EMAIL}" promu en admin.`);
    } else {
      // Créer un nouvel utilisateur admin
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await conn.execute(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, 'admin', 1)`,
        [ADMIN_FNAME, ADMIN_LNAME, ADMIN_EMAIL, hash]
      );
      console.log('✅ Compte admin créé avec succès :');
      console.log(`   Email    : ${ADMIN_EMAIL}`);
      console.log(`   Password : ${ADMIN_PASSWORD}`);
    }

    console.log('\n🎉 Vous pouvez maintenant vous connecter au panneau admin.');

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
