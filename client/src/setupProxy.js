const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:5003',
    changeOrigin: true,
    secure: false,
  });

  // Forwarder toutes les requêtes API vers le backend
  app.use('/api', proxy);

  // ✅ Forwarder les fichiers uploadés (images produits) vers le backend
  // Sans ça, <img src="/uploads/..."/> retourne 404 depuis le dev server React
  app.use('/uploads', proxy);
};
