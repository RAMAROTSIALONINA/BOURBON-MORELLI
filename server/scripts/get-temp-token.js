const axios = require('axios');

async function getTempToken() {
  try {
    console.log('=== OBTENTION TOKEN ADMIN TEMPORAIRE ===\n');

    // Essayer d'obtenir un token temporaire
    const response = await axios.get('http://localhost:5003/api/users/admin/temp-token');
    
    if (response.data && response.data.token) {
      const tempToken = response.data.token;
      console.log('Token temporaire obtenu:', tempToken.substring(0, 50) + '...');
      
      // Afficher le token complet pour copier/coller
      console.log('\n=== TOKEN TEMPORAIRE À COPIER ===');
      console.log(tempToken);
      console.log('================================\n');
      
      console.log('Instructions:');
      console.log('1. Ouvrez les outils de développement du navigateur (F12)');
      console.log('2. Allez dans l\'onglet Console');
      console.log('3. Exécutez: localStorage.setItem("adminToken", "' + tempToken + '")');
      console.log('4. Rafraîchissez la page d\'administration');
      
    } else {
      console.log('Erreur: Token non reçu dans la réponse');
      console.log('Réponse:', response.data);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token temporaire:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

getTempToken();
