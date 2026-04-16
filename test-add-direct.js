// Test direct de l'ajout d'utilisateur avec curl
const http = require('http');
const https = require('https');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAddUser() {
  console.log('=== TEST DIRECT AJOUT UTILISATEUR ===');
  
  try {
    // 1. Login pour obtenir le token
    console.log('\n1. Login admin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: 'admin@bourbonmorelli.com',
      password: 'admin123'
    };
    
    const loginResult = await makeRequest(loginOptions, loginData);
    console.log('Login Status:', loginResult.status);
    console.log('Login Data:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.status !== 200 || !loginResult.data?.token) {
      console.log('ERREUR: Login échoué');
      return;
    }
    
    const token = loginResult.data.token;
    console.log('Token obtenu:', token.substring(0, 50) + '...');
    
    // 2. Test d'ajout d'utilisateur
    console.log('\n2. Ajout utilisateur...');
    const addOptions = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/users/admin/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const userData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test.user@example.com',
      phone: '+33 6 12 34 56 78',
      password: 'test123',
      role: 'customer',
      status: 'active'
    };
    
    console.log('Données envoyées:', JSON.stringify(userData, null, 2));
    
    const addResult = await makeRequest(addOptions, userData);
    console.log('Ajout Status:', addResult.status);
    console.log('Ajout Data:', JSON.stringify(addResult.data, null, 2));
    
    // 3. Vérifier que l'utilisateur existe
    console.log('\n3. Vérification utilisateur...');
    const listOptions = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/users/admin/list',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const listResult = await makeRequest(listOptions);
    console.log('List Status:', listResult.status);
    
    if (listResult.status === 200 && listResult.data?.users) {
      const testUser = listResult.data.users.find(u => u.email === 'test.user@example.com');
      if (testUser) {
        console.log('SUCCESS: Utilisateur trouvé dans la base!');
        console.log('ID:', testUser.id);
        console.log('Nom:', testUser.first_name, testUser.last_name);
        console.log('Email:', testUser.email);
        console.log('Rôle:', testUser.role);
        console.log('Statut:', testUser.status);
      } else {
        console.log('ERREUR: Utilisateur NON trouvé dans la base');
        console.log('Utilisateurs trouvés:', listResult.data.users.map(u => u.email));
      }
    } else {
      console.log('ERREUR: Impossible de vérifier la liste');
    }
    
  } catch (error) {
    console.error('ERREUR:', error.message);
  }
}

testAddUser();
