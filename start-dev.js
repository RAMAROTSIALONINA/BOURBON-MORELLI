const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Lancement de BOURBON MORELLI en mode développement...\n');

// Démarrer le backend (version simplifiée)
const backend = spawn('node', ['index-dev.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data}`);
});

// Attendre un peu avant de démarrer le frontend
setTimeout(() => {
  console.log('\n📱 Démarrage du frontend React...\n');
  
  // Démarrer le frontend
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'pipe',
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data}`);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });

}, 3000);

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

// Gérer l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt des serveurs...');
  backend.kill();
  process.exit(0);
});

// Afficher les URLs une fois que les serveurs sont démarrés
setTimeout(() => {
  console.log('\n🌐 URLs d\'accès:');
  console.log(`   Frontend: http://localhost:3000`);
  console.log(`   Backend API: http://localhost:5003/api`);
  console.log(`   Health Check: http://localhost:5003/api/health`);
}, 5000);
