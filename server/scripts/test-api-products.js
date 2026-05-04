const axios = require('axios');

async function testApiProducts() {
  try {
    console.log('=== TEST API PRODUITS ===\n');
    
    const API_BASE_URL = 'http://localhost:5003/api/public';
    
    // Test récupération de tous les produits
    console.log('1. Test GET /products');
    const response = await axios.get(`${API_BASE_URL}/products`);
    
    if (response.data && response.data.products) {
      console.log(`✅ ${response.data.products.length} produits récupérés`);
      
      // Afficher les détails des 3 premiers produits
      response.data.products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduit ${index + 1}:`);
        console.log(`  ID: ${product.id}`);
        console.log(`  Nom: ${product.name}`);
        console.log(`  Tailles: ${product.sizes || 'NULL'}`);
        console.log(`  Type tailles: ${typeof product.sizes}`);
        console.log(`  Est array: ${Array.isArray(product.sizes)}`);
      });
    } else {
      console.log('❌ Aucun produit récupéré');
    }
    
    // Test récupération par catégorie
    console.log('\n2. Test GET /products/category/t-shirts');
    try {
      const categoryResponse = await axios.get(`${API_BASE_URL}/products/category/t-shirts`);
      
      if (categoryResponse.data && categoryResponse.data.products) {
        console.log(`✅ ${categoryResponse.data.products.length} produits T-Shirts récupérés`);
        
        categoryResponse.data.products.forEach((product, index) => {
          console.log(`  T-Shirt ${index + 1}: ${product.name} - Tailles: ${product.sizes || 'NULL'}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur catégorie T-Shirts:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testApiProducts();
