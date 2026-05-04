const axios = require('axios');

async function testOrdersFix() {
  try {
    console.log('=== TEST CORRECTION ORDRES ===\n');
    
    const API_BASE_URL = 'http://localhost:5003';
    
    // Test sans token (devrait échouer proprement)
    console.log('1. Test GET /api/orders sans token');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      console.log('❌ Devrait échouer mais a réussi');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctement rejeté (401)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }
    
    // Test avec token invalide
    console.log('\n2. Test GET /api/orders avec token invalide');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Devrait échouer mais a réussi');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctement rejeté (401)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }
    
    console.log('\n🎉 Tests terminés - Les corrections devraient éviter les erreurs "undefined"');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testOrdersFix();
