const mysql = require('mysql2/promise');
require('dotenv').config();

async function addProductImages() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== AJOUT DES IMAGES AUX PRODUITS ===\n');

    // Images disponibles et leur association avec les produits
    const productImages = [
      { productId: 2, imageName: 'T-shirts1.PNG', isPrimary: true },
      { productId: 2, imageName: 'T-shirts2.PNG', isPrimary: false },
      { productId: 3, imageName: 'Polos 1.PNG', isPrimary: true },
      { productId: 3, imageName: 'Polos 2.PNG', isPrimary: false },
      { productId: 4, imageName: 'Pantalons 1.PNG', isPrimary: true },
      { productId: 4, imageName: 'Pantalons 2.PNG', isPrimary: false },
      { productId: 15, imageName: 'T-shirts3.PNG', isPrimary: true }
    ];

    // D'abord supprimer les images existantes pour éviter les doublons
    console.log('Suppression des images existantes...');
    await connection.execute('DELETE FROM product_images');

    // Ajouter les nouvelles images
    for (const productImage of productImages) {
      const { productId, imageName, isPrimary } = productImage;
      
      console.log(`Ajout de l'image "${imageName}" au produit ID ${productId}`);
      
      await connection.execute(`
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        productId,
        `/images/${imageName}`,
        `Image pour produit ${productId}`,
        isPrimary
      ]);
    }

    // Vérifier les images ajoutées
    console.log('\n=== VÉRIFICATION DES IMAGES AJOUTÉES ===\n');
    const [images] = await connection.execute(`
      SELECT pi.*, p.name as product_name
      FROM product_images pi
      LEFT JOIN products p ON pi.product_id = p.id
      ORDER BY pi.product_id, pi.is_primary DESC
    `);

    images.forEach(img => {
      console.log(`Produit: ${img.product_name} (ID: ${img.product_id})`);
      console.log(`  Image: ${img.image_url}`);
      console.log(`  Primaire: ${img.is_primary ? 'Oui' : 'Non'}`);
      console.log('---');
    });

    await connection.end();
    console.log('\nImages ajoutées avec succès !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

addProductImages();
