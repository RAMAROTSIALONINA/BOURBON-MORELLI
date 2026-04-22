const mysql = require('mysql2/promise');
require('dotenv').config();

async function syncCategories() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('Vérification des catégories existantes...');
    const [existingCategories] = await connection.execute('SELECT * FROM categories');
    console.log('Catégories existantes:', existingCategories.map(c => c.name));

    // Catégories à ajouter si elles n'existent pas
    const categoriesToAdd = [
      { name: 'Vêtements', slug: 'vetements', description: 'Tous les types de vêtements' },
      { name: 'Accessoires', slug: 'accessoires', description: 'Accessoires de mode' },
      { name: 'Linge de maison', slug: 'linge-de-maison', description: 'Linge et articles pour la maison' },
      { name: 'Electronique', slug: 'electronique', description: 'Appareils électroniques' },
      { name: 'Autre', slug: 'autre', description: 'Autres catégories' }
    ];

    for (const category of categoriesToAdd) {
      const [existing] = await connection.execute(
        'SELECT id FROM categories WHERE name = ?',
        [category.name]
      );

      if (existing.length === 0) {
        console.log(`Ajout de la catégorie: ${category.name}`);
        await connection.execute(`
          INSERT INTO categories (name, slug, description, sort_order, is_active, created_at)
          VALUES (?, ?, ?, ?, 1, NOW())
        `, [category.name, category.slug, category.description, 0]);
      } else {
        console.log(`Catégorie ${category.name} existe déjà`);
      }
    }

    const [finalCategories] = await connection.execute('SELECT * FROM categories ORDER BY name');
    console.log('\nCatégories finales dans la base:');
    finalCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });

    await connection.end();
    console.log('\nSynchronisation terminée !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

syncCategories();
