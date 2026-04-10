# Guide de Déploiement - BOURBON MORELLI

## Déploiement avec Docker

### Prérequis

- Docker et Docker Compose installés
- Domaine configuré pour le HTTPS
- Certificats SSL (Let's Encrypt recommandé)

### Étapes de déploiement

1. **Cloner le projet**
```bash
git clone <repository-url>
cd bourbon-morelli
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

3. **Configurer les certificats SSL**
```bash
mkdir -p nginx/ssl
# Copier vos certificats dans nginx/ssl/
# nginx/ssl/cert.pem
# nginx/ssl/key.pem
```

4. **Démarrer les services**
```bash
docker-compose up -d
```

5. **Vérifier le déploiement**
```bash
docker-compose ps
docker-compose logs -f
```

## Déploiement sur VPS (Ubuntu/Debian)

### 1. Prérequis système

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Installer Nginx
sudo apt install nginx -y

# Installer PM2
sudo npm install -g pm2

# Installer Certbot pour SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuration de la base de données

```bash
# Se connecter à MySQL
sudo mysql -u root -p

# Créer la base de données
CREATE DATABASE bourbon_morelli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bourbon_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON bourbon_morelli.* TO 'bourbon_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importer le schéma
mysql -u bourbon_user -p bourbon_morelli < database/schema.sql
```

### 3. Déploiement du backend

```bash
# Cloner le projet
git clone <repository-url>
cd bourbon-morelli/server

# Installer les dépendances
npm install --production

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Créer les répertoires nécessaires
mkdir -p uploads logs

# Démarrer avec PM2
pm2 start index.js --name "bourbon-backend"
pm2 save
pm2 startup
```

### 4. Déploiement du frontend

```bash
# Aller dans le dossier client
cd ../client

# Installer les dépendances
npm install

# Construire pour la production
npm run build

# Configurer Nginx
sudo cp nginx.conf /etc/nginx/sites-available/bourbon-morelli
sudo ln -s /etc/nginx/sites-available/bourbon-morelli /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configuration SSL avec Let's Encrypt

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Configurer le renouvellement automatique
sudo crontab -e
# Ajouter cette ligne :
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Configuration Nginx complète

```nginx
# /etc/nginx/sites-available/bourbon-morelli
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    root /path/to/bourbon-morelli/client/build;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Uploads
    location /uploads/ {
        alias /path/to/bourbon-morelli/server/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

## Déploiement sur Heroku

### 1. Préparation

```bash
# Installer Heroku CLI
# Se connecter
heroku login

# Créer l'application
heroku create bourbon-morelli

# Ajouter le database add-on
heroku addons:create jdbd:mysql:hobby-dev

# Configurer les variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre_jwt_secret
heroku config:set STRIPE_SECRET_KEY=votre_cle_stripe
heroku config:set PAYPAL_CLIENT_ID=votre_client_id_paypal
heroku config:set PAYPAL_CLIENT_SECRET=votre_client_secret_paypal
```

### 2. Configuration du backend

```bash
# Dans server/package.json, ajouter :
"scripts": {
  "start": "node index.js",
  "heroku-postbuild": "cd ../client && npm install && npm run build"
}

# Créer Procfile
echo "web: node index.js" > Procfile

# Déployer
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 3. Configuration du frontend

```bash
# Dans client/package.json, ajouter :
"homepage": "https://votre-app.herokuapp.com"

# Mettre à jour les URLs API dans le code pour pointer vers Heroku
```

## Monitoring et Maintenance

### 1. Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2
pm2 logs
pm2 monit

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Sauvegardes

```bash
# Script de sauvegarde MySQL
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u bourbon_user -p bourbon_morelli > backup_$DATE.sql
gzip backup_$DATE.sql

# Automatiser avec cron
0 2 * * * /path/to/backup_script.sh
```

### 3. Mises à jour

```bash
# Docker
docker-compose pull
docker-compose up -d

# PM2
cd /path/to/bourbon-morelli/server
git pull
npm install --production
pm2 restart bourbon-backend

# Frontend
cd ../client
git pull
npm install
npm run build
sudo systemctl reload nginx
```

### 4. Performance

```bash
# Optimiser les images
# Utiliser WebP, lazy loading, CDN

# Configurer Redis pour le cache
npm install redis connect-redis

# Configurer CDN pour les assets statiques
```

## Sécurité

### 1. Firewall

```bash
# Configurer UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Monitoring

```bash
# Installer fail2ban
sudo apt install fail2ban -y

# Configurer les alertes
# Utiliser services comme Sentry pour le monitoring d'erreurs
```

### 3. HTTPS

Forcer HTTPS en production :
- Redirection automatique HTTP vers HTTPS
- Headers HSTS
- Certificats valides

## Support

- Documentation complète : https://docs.bourbonmorelli.com
- Support technique : support@bourbonmorelli.com
- Issues GitHub : https://github.com/bourbon-morelli/issues
