const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:5003',
    changeOrigin: true,
    secure: false,
  });

  // Proxy toutes les requêtes API vers le backend
  app.use('/api', proxy);
  
  // Ne pas proxy les fichiers statiques (images, css, js)
  // Ils sont servis par React Development Server
};
