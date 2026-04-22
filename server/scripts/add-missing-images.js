const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingImages() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== AJOUT DES IMAGES MANQUANTES ===\n');

    // Récupérer tous les produits sans images
    const [productsWithoutImages] = await connection.execute(`
      SELECT p.id, p.name
      FROM products p
      WHERE p.id NOT IN (
        SELECT DISTINCT product_id FROM product_images
      )
      ORDER BY p.id
    `);

    console.log(`Produits sans images: ${productsWithoutImages.length}\n`);

    // Images disponibles à assigner
    const availableImages = [
      '/images/BOURBON MORELLI.png',
      '/images/nappe-table.png',
      '/images/Nape de table.PNG'
    ];

    let imageIndex = 0;

    for (const product of productsWithoutImages) {
      const { id, name } = product;
      const imageUrl = availableImages[imageIndex % availableImages.length];
      
      console.log(`Ajout d'image pour produit ID ${id} (${name}): ${imageUrl}`);
      
      await connection.execute(`
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary, created_at)
        VALUES (?, ?, ?, 1, NOW())
      `, [id, imageUrl, `Image pour ${name}`]);
      
      imageIndex++;
    }

    // Vérification finale
    console.log('\n=== VÉRIFICATION FINALE ===\n');
    const [allProducts] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      ORDER BY p.id
    `);

    console.log('État final des produits:');
    allProducts.forEach(product => {
      console.log(`ID ${product.id}: ${product.name} -> Image: ${product.primary_image || 'AUCUNE'}`);
    });

    await connection.end();
    console.log('\nImages manquantes ajoutées avec succès !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

addMissingImages();
