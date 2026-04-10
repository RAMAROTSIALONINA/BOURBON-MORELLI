# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Étape 2: Production
FROM node:18-alpine AS production

# Installer les dépendances système
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p uploads logs && chown -R nodejs:nodejs /app

# Changer d'utilisateur
USER nodejs

# Exposer le port
EXPOSE 5000

# Variables d'environnement
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Démarrer l'application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
