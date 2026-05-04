const axios = require('axios');

async function testAboutAPI() {
  try {
    console.log('=== TEST API ABOUT ===\n');
    
    const API_BASE_URL = 'http://localhost:5003';
    
    // Test API publique
    console.log('1. Test GET /api/site-settings/about');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/site-settings/about`);
      
      if (response.data && response.data.success) {
        console.log('✅ API about fonctionnelle');
        const aboutData = response.data.value;
        
        console.log('\n--- Équipe ---');
        if (aboutData.team && aboutData.team.length > 0) {
          aboutData.team.forEach((member, idx) => {
            console.log(`Membre ${idx + 1}:`);
            console.log(`  Nom: ${member.name || 'Non défini'}`);
            console.log(`  Rôle: ${member.role || 'Non défini'}`);
            console.log(`  Photo: ${member.photo || 'Aucune photo'}`);
            console.log(`  Bio: ${member.bio || 'Non définie'}`);
            console.log('');
          });
        } else {
          console.log('❌ Aucun membre dans l\'équipe');
        }
        
      } else {
        console.log('❌ API about - réponse invalide');
      }
    } catch (error) {
      console.log('❌ Erreur API about:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAboutAPI();
