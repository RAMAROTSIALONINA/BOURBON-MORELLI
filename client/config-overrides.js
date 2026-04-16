module.exports = {
  // Désactiver complètement webpack-dev-server
  devServer: (configFunction) => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.hot = false;
      config.liveReload = false;
      config.client = {
        overlay: false,
        webSocketURL: 'ws://localhost:0/ws'
      };
      config.webSocketServer = false;
      return config;
    };
  },
  webpack: (config) => {
    // Retirer tous les plugins liés au développement
    config.plugins = config.plugins.filter(plugin => {
      const name = plugin.constructor.name;
      return !name.includes('Hot') && 
             !name.includes('WebSocket') && 
             !name.includes('DevServer') &&
             name !== 'webpack.HotModuleReplacementPlugin';
    });
    return config;
  }
};
