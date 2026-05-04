const axios = require('axios');

async function testFooterAPI() {
  try {
    console.log('=== TEST API FOOTER ===\n');
    
    const API_BASE_URL = 'http://localhost:5003';
    
    // Test API publique
    console.log('1. Test GET /api/public/footer');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/footer`);
      
      if (response.data && response.data.success) {
        console.log('✅ API publique fonctionnelle');
        console.log('Sections disponibles:', Object.keys(response.data.data));
        
        // Afficher quelques exemples
        console.log('\n--- Contact ---');
        const contact = response.data.data.contact || [];
        contact.forEach(item => {
          console.log(`${item.label}: ${item.value}`);
        });
        
        console.log('\n--- Features ---');
        const features = response.data.data.features || [];
        features.forEach(item => {
          console.log(`${item.label}: ${item.value.title} - ${item.value.description}`);
        });
        
      } else {
        console.log('❌ API publique - réponse invalide');
      }
    } catch (error) {
      console.log('❌ Erreur API publique:', error.message);
    }
    
    // Test API admin
    console.log('\n2. Test GET /api/admin/footer');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/footer`);
      
      if (response.data && response.data.success) {
        console.log('✅ API admin fonctionnelle');
        console.log('Sections disponibles:', Object.keys(response.data.data));
        console.log(`Total éléments: ${Object.values(response.data.data).reduce((sum, section) => sum + section.length, 0)}`);
      } else {
        console.log('❌ API admin - réponse invalide');
      }
    } catch (error) {
      console.log('❌ Erreur API admin:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFooterAPI();
